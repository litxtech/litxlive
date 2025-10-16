import { Hono } from 'hono';
import type { Context } from 'hono';
import { auth } from '../middlewares/auth.js';
import { q } from '../lib/db.js';
import { audit } from '../lib/audit.js';

const r = new Hono();

r.get('/', async (c: Context) => {
  try {
    const status = c.req.query('status') || 'active';
    const lang = c.req.query('lang');
    const limit = Number(c.req.query('limit') || 50);

    const rooms = await q(
      `SELECT 
        r.id,
        r.title,
        r.description,
        r.lang,
        r.capacity,
        r.access_type,
        r.status,
        r.tags,
        r.created_at,
        json_build_object(
          'id', u.id,
          'name', u.name,
          'avatar_url', up.avatar_url
        ) as host,
        (
          SELECT COUNT(*)::int
          FROM room_members rm
          WHERE rm.room_id = r.id AND rm.left_at IS NULL
        ) as member_count
      FROM rooms r
      JOIN users u ON u.id = r.host_id
      LEFT JOIN user_profiles up ON up.user_id = u.id
      WHERE r.status = $1
        ${lang ? 'AND r.lang = $3' : ''}
      ORDER BY r.created_at DESC
      LIMIT $2`,
      lang ? [status, limit, lang] : [status, limit]
    );

    return c.json({ success: true, rooms: rooms.rows });
  } catch (error) {
    console.error('Get rooms error:', error);
    return c.json({ success: false, message: 'Failed to fetch rooms' }, 500);
  }
});

r.post('/', auth(), async (c: Context) => {
  try {
    const userId = (c.get('auth') as any).userId;
    const { title, description, lang = 'en', capacity = 21, accessType = 'open', password, tags } = await c.req.json();

    if (!title) {
      return c.json({ success: false, message: 'Title required' }, 400);
    }

    if (capacity > 21) {
      return c.json({ success: false, message: 'Maximum capacity is 21' }, 400);
    }

    const existingActiveRoom = await q(
      `SELECT id FROM rooms WHERE host_id = $1 AND status = 'active'`,
      [userId]
    );

    if (existingActiveRoom.rows.length > 0) {
      return c.json({ 
        success: false, 
        message: 'You already have an active room',
        existingRoomId: existingActiveRoom.rows[0].id
      }, 409);
    }

    const roomResult = await q(
      `INSERT INTO rooms (title, description, lang, capacity, access_type, password, host_id, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, created_at`,
      [title, description, lang, capacity, accessType, password, userId, tags || []]
    );

    const roomId = roomResult.rows[0].id;

    await q(
      `INSERT INTO room_members (room_id, user_id, role)
       VALUES ($1, $2, 'host')
       ON CONFLICT (room_id, user_id) DO NOTHING`,
      [roomId, userId]
    );

    await audit(
      userId,
      'create_room',
      'room',
      roomId,
      { title, capacity, accessType },
      c.req.header('x-forwarded-for'),
      c.req.header('user-agent')
    );

    console.log(`[Room Created] ID: ${roomId}, Host: ${userId}`);

    return c.json({ 
      success: true, 
      roomId,
      createdAt: roomResult.rows[0].created_at
    });
  } catch (error: any) {
    console.error('Create room error:', error);
    if (error?.code === '23505') {
      return c.json({ success: false, message: 'Duplicate room creation detected' }, 409);
    }
    return c.json({ success: false, message: 'Failed to create room' }, 500);
  }
});

r.get('/:id', async (c: Context) => {
  try {
    const { id } = c.req.param();

    const roomResult = await q(
      `SELECT 
        r.id,
        r.title,
        r.description,
        r.lang,
        r.capacity,
        r.access_type,
        r.status,
        r.tags,
        r.created_at,
        json_build_object(
          'id', u.id,
          'name', u.name,
          'avatar_url', up.avatar_url
        ) as host
      FROM rooms r
      JOIN users u ON u.id = r.host_id
      LEFT JOIN user_profiles up ON up.user_id = u.id
      WHERE r.id = $1`,
      [id]
    );

    if (roomResult.rows.length === 0) {
      return c.json({ success: false, message: 'Room not found' }, 404);
    }

    const membersResult = await q(
      `SELECT 
        rm.role,
        rm.is_muted,
        rm.is_hand_raised,
        rm.joined_at,
        json_build_object(
          'id', u.id,
          'name', u.name,
          'avatar_url', up.avatar_url
        ) as user
      FROM room_members rm
      JOIN users u ON u.id = rm.user_id
      LEFT JOIN user_profiles up ON up.user_id = u.id
      WHERE rm.room_id = $1 AND rm.left_at IS NULL
      ORDER BY 
        CASE rm.role
          WHEN 'host' THEN 1
          WHEN 'co-host' THEN 2
          WHEN 'speaker' THEN 3
          ELSE 4
        END,
        rm.joined_at ASC`,
      [id]
    );

    return c.json({ 
      success: true, 
      room: roomResult.rows[0],
      members: membersResult.rows
    });
  } catch (error) {
    console.error('Get room error:', error);
    return c.json({ success: false, message: 'Failed to fetch room' }, 500);
  }
});

r.post('/:id/join', auth(), async (c: Context) => {
  try {
    const userId = (c.get('auth') as any).userId;
    const { id } = c.req.param();
    const { password } = await c.req.json();

    const roomResult = await q(
      `SELECT capacity, access_type, password, status FROM rooms WHERE id = $1`,
      [id]
    );

    if (roomResult.rows.length === 0) {
      return c.json({ success: false, message: 'Room not found' }, 404);
    }

    const room = roomResult.rows[0];

    if (room.status !== 'active') {
      return c.json({ success: false, message: 'Room is not active' }, 400);
    }

    if (room.access_type === 'password' && room.password !== password) {
      return c.json({ success: false, message: 'Invalid password' }, 403);
    }

    const memberCountResult = await q(
      `SELECT COUNT(*)::int as count FROM room_members WHERE room_id = $1 AND left_at IS NULL`,
      [id]
    );

    if (memberCountResult.rows[0].count >= room.capacity) {
      return c.json({ success: false, message: 'Room is full' }, 400);
    }

    const existingMember = await q(
      `SELECT id FROM room_members WHERE room_id = $1 AND user_id = $2 AND left_at IS NULL`,
      [id, userId]
    );

    if (existingMember.rows.length > 0) {
      return c.json({ success: true, message: 'Already in room' });
    }

    await q(
      `INSERT INTO room_members (room_id, user_id, role)
       VALUES ($1, $2, 'listener')
       ON CONFLICT (room_id, user_id) DO UPDATE SET left_at = NULL`,
      [id, userId]
    );

    return c.json({ success: true });
  } catch (error) {
    console.error('Join room error:', error);
    return c.json({ success: false, message: 'Failed to join room' }, 500);
  }
});

r.post('/:id/leave', auth(), async (c: Context) => {
  try {
    const userId = (c.get('auth') as any).userId;
    const { id } = c.req.param();

    await q(
      `UPDATE room_members SET left_at = now() WHERE room_id = $1 AND user_id = $2`,
      [id, userId]
    );

    return c.json({ success: true });
  } catch (error) {
    console.error('Leave room error:', error);
    return c.json({ success: false, message: 'Failed to leave room' }, 500);
  }
});

r.post('/:id/raise-hand', auth(), async (c: Context) => {
  try {
    const userId = (c.get('auth') as any).userId;
    const { id } = c.req.param();

    await q(
      `UPDATE room_members SET is_hand_raised = true WHERE room_id = $1 AND user_id = $2`,
      [id, userId]
    );

    return c.json({ success: true });
  } catch (error) {
    console.error('Raise hand error:', error);
    return c.json({ success: false, message: 'Failed to raise hand' }, 500);
  }
});

r.post('/:id/promote', auth(), async (c: Context) => {
  try {
    const userId = (c.get('auth') as any).userId;
    const { id } = c.req.param();
    const { targetUserId, role } = await c.req.json();

    if (!['co-host', 'speaker', 'listener'].includes(role)) {
      return c.json({ success: false, message: 'Invalid role' }, 400);
    }

    const roomResult = await q(
      `SELECT host_id FROM rooms WHERE id = $1`,
      [id]
    );

    if (roomResult.rows.length === 0) {
      return c.json({ success: false, message: 'Room not found' }, 404);
    }

    const memberResult = await q(
      `SELECT role FROM room_members WHERE room_id = $1 AND user_id = $2 AND left_at IS NULL`,
      [id, userId]
    );

    if (memberResult.rows.length === 0) {
      return c.json({ success: false, message: 'Not in room' }, 403);
    }

    const userRole = memberResult.rows[0].role;

    if (userRole !== 'host' && userRole !== 'co-host') {
      return c.json({ success: false, message: 'Insufficient permissions' }, 403);
    }

    await q(
      `UPDATE room_members 
       SET role = $1, is_hand_raised = false 
       WHERE room_id = $2 AND user_id = $3`,
      [role, id, targetUserId]
    );

    await audit(
      userId,
      'promote_member',
      'room_member',
      id,
      { targetUserId, role },
      c.req.header('x-forwarded-for'),
      c.req.header('user-agent')
    );

    return c.json({ success: true });
  } catch (error) {
    console.error('Promote member error:', error);
    return c.json({ success: false, message: 'Failed to promote member' }, 500);
  }
});

r.post('/:id/mute', auth(), async (c: Context) => {
  try {
    const userId = (c.get('auth') as any).userId;
    const { id } = c.req.param();
    const { targetUserId, muted } = await c.req.json();

    const memberResult = await q(
      `SELECT role FROM room_members WHERE room_id = $1 AND user_id = $2 AND left_at IS NULL`,
      [id, userId]
    );

    if (memberResult.rows.length === 0) {
      return c.json({ success: false, message: 'Not in room' }, 403);
    }

    const userRole = memberResult.rows[0].role;

    if (userRole !== 'host' && userRole !== 'co-host') {
      return c.json({ success: false, message: 'Insufficient permissions' }, 403);
    }

    await q(
      `UPDATE room_members SET is_muted = $1 WHERE room_id = $2 AND user_id = $3`,
      [muted, id, targetUserId]
    );

    return c.json({ success: true });
  } catch (error) {
    console.error('Mute member error:', error);
    return c.json({ success: false, message: 'Failed to mute member' }, 500);
  }
});

r.post('/:id/end', auth(), async (c: Context) => {
  try {
    const userId = (c.get('auth') as any).userId;
    const { id } = c.req.param();

    const roomResult = await q(
      `SELECT host_id FROM rooms WHERE id = $1`,
      [id]
    );

    if (roomResult.rows.length === 0) {
      return c.json({ success: false, message: 'Room not found' }, 404);
    }

    if (roomResult.rows[0].host_id !== userId) {
      return c.json({ success: false, message: 'Only host can end room' }, 403);
    }

    await q(
      `UPDATE rooms SET status = 'ended', ended_at = now() WHERE id = $1`,
      [id]
    );

    await q(
      `UPDATE room_members SET left_at = now() WHERE room_id = $1 AND left_at IS NULL`,
      [id]
    );

    await audit(
      userId,
      'end_room',
      'room',
      id,
      {},
      c.req.header('x-forwarded-for'),
      c.req.header('user-agent')
    );

    return c.json({ success: true });
  } catch (error) {
    console.error('End room error:', error);
    return c.json({ success: false, message: 'Failed to end room' }, 500);
  }
});

export default r;
