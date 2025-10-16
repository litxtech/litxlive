import { Hono } from 'hono';
import type { Context } from 'hono';
import { auth } from '../middlewares/auth.js';
import { q } from '../lib/db.js';
import { TranslationService } from '../services/translationService.js';

const r = new Hono();

r.use('*', auth());

r.get('/conversations', async (c: Context) => {
  try {
    const userId = (c.get('auth') as any).userId;
    
    const conversations = await q(
      `SELECT 
        c.id,
        c.type,
        c.title,
        c.created_at,
        c.updated_at,
        (
          SELECT json_agg(json_build_object(
            'id', u.id,
            'name', u.name,
            'avatar_url', up.avatar_url
          ))
          FROM conversation_participants cp
          JOIN users u ON u.id = cp.user_id
          LEFT JOIN user_profiles up ON up.user_id = u.id
          WHERE cp.conversation_id = c.id AND cp.user_id != $1
        ) as participants,
        (
          SELECT json_build_object(
            'id', m.id,
            'body', m.body,
            'kind', m.kind,
            'created_at', m.created_at,
            'sender_id', m.sender_id
          )
          FROM messages m
          WHERE m.conversation_id = c.id
          ORDER BY m.created_at DESC
          LIMIT 1
        ) as last_message,
        (
          SELECT COUNT(*)
          FROM messages m
          LEFT JOIN conversation_participants cp ON cp.conversation_id = m.conversation_id AND cp.user_id = $1
          WHERE m.conversation_id = c.id 
            AND m.sender_id != $1
            AND (cp.last_read_at IS NULL OR m.created_at > cp.last_read_at)
        )::int as unread_count
      FROM conversations c
      JOIN conversation_participants cp ON cp.conversation_id = c.id
      WHERE cp.user_id = $1
      ORDER BY c.updated_at DESC`,
      [userId]
    );

    return c.json({ success: true, conversations: conversations.rows });
  } catch (error) {
    console.error('Get conversations error:', error);
    return c.json({ success: false, message: 'Failed to fetch conversations' }, 500);
  }
});

r.post('/conversations', async (c: Context) => {
  try {
    const userId = (c.get('auth') as any).userId;
    const { participantIds, type = 'dm', title } = await c.req.json();

    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
      return c.json({ success: false, message: 'Participant IDs required' }, 400);
    }

    if (type === 'dm') {
      const existingConv = await q(
        `SELECT c.id
         FROM conversations c
         JOIN conversation_participants cp1 ON cp1.conversation_id = c.id
         JOIN conversation_participants cp2 ON cp2.conversation_id = c.id
         WHERE c.type = 'dm'
           AND cp1.user_id = $1
           AND cp2.user_id = $2
         LIMIT 1`,
        [userId, participantIds[0]]
      );

      if (existingConv.rows.length > 0) {
        return c.json({ success: true, conversationId: existingConv.rows[0].id });
      }
    }

    const convResult = await q(
      `INSERT INTO conversations (type, title, created_by)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [type, title, userId]
    );

    const conversationId = convResult.rows[0].id;

    const allParticipants = [userId, ...participantIds];
    for (const participantId of allParticipants) {
      await q(
        `INSERT INTO conversation_participants (conversation_id, user_id)
         VALUES ($1, $2)`,
        [conversationId, participantId]
      );
    }

    return c.json({ success: true, conversationId });
  } catch (error) {
    console.error('Create conversation error:', error);
    return c.json({ success: false, message: 'Failed to create conversation' }, 500);
  }
});

r.get('/conversations/:id/messages', async (c: Context) => {
  try {
    const userId = (c.get('auth') as any).userId;
    const { id } = c.req.param();
    const limit = Number(c.req.query('limit') || 50);
    const before = c.req.query('before');

    const messages = await q(
      `SELECT 
        m.id,
        m.body,
        m.kind,
        m.status,
        m.translated_body,
        m.created_at,
        m.sender_id,
        json_build_object(
          'id', u.id,
          'name', u.name,
          'avatar_url', up.avatar_url
        ) as sender,
        CASE WHEN m.media_id IS NOT NULL THEN
          json_build_object(
            'id', med.id,
            'type', med.type,
            'url', med.url,
            'thumbnail_url', med.thumbnail_url
          )
        ELSE NULL END as media,
        CASE WHEN m.gift_id IS NOT NULL THEN
          json_build_object(
            'id', g.id,
            'name', g.name,
            'thumbnail_url', g.thumbnail_url,
            'coin_price', g.coin_price
          )
        ELSE NULL END as gift
      FROM messages m
      JOIN users u ON u.id = m.sender_id
      LEFT JOIN user_profiles up ON up.user_id = u.id
      LEFT JOIN media med ON med.id = m.media_id
      LEFT JOIN gifts g ON g.id = m.gift_id
      WHERE m.conversation_id = $1
        ${before ? 'AND m.created_at < $3' : ''}
      ORDER BY m.created_at DESC
      LIMIT $2`,
      before ? [id, limit, before] : [id, limit]
    );

    await q(
      `UPDATE conversation_participants
       SET last_read_at = now()
       WHERE conversation_id = $1 AND user_id = $2`,
      [id, userId]
    );

    return c.json({ success: true, messages: messages.rows.reverse() });
  } catch (error) {
    console.error('Get messages error:', error);
    return c.json({ success: false, message: 'Failed to fetch messages' }, 500);
  }
});

r.post('/conversations/:id/messages', async (c: Context) => {
  try {
    const userId = (c.get('auth') as any).userId;
    const { id } = c.req.param();
    const { body, kind = 'text', mediaId, giftId } = await c.req.json();

    if (!body && !mediaId && !giftId) {
      return c.json({ success: false, message: 'Message content required' }, 400);
    }

    const messageResult = await q(
      `INSERT INTO messages (conversation_id, sender_id, body, kind, media_id, gift_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'sent')
       RETURNING id, created_at`,
      [id, userId, body, kind, mediaId, giftId]
    );

    await q(
      `UPDATE conversations SET updated_at = now() WHERE id = $1`,
      [id]
    );

    const message = messageResult.rows[0];

    return c.json({ 
      success: true, 
      message: {
        id: message.id,
        body,
        kind,
        status: 'sent',
        created_at: message.created_at,
        sender_id: userId
      }
    });
  } catch (error) {
    console.error('Send message error:', error);
    return c.json({ success: false, message: 'Failed to send message' }, 500);
  }
});

r.post('/messages/:id/translate', async (c: Context) => {
  try {
    const { id } = c.req.param();
    const { targetLang } = await c.req.json();

    if (!targetLang) {
      return c.json({ success: false, message: 'Target language required' }, 400);
    }

    const messageResult = await q(
      `SELECT body, translated_body FROM messages WHERE id = $1`,
      [id]
    );

    if (messageResult.rows.length === 0) {
      return c.json({ success: false, message: 'Message not found' }, 404);
    }

    const message = messageResult.rows[0];
    const translatedBody = message.translated_body || {};

    if (translatedBody[targetLang]) {
      return c.json({ 
        success: true, 
        translatedText: translatedBody[targetLang],
        cached: true
      });
    }

    const result = await TranslationService.translate(
      message.body,
      'auto',
      targetLang
    );

    translatedBody[targetLang] = result.translatedText;

    await q(
      `UPDATE messages SET translated_body = $1 WHERE id = $2`,
      [JSON.stringify(translatedBody), id]
    );

    return c.json({ 
      success: true, 
      translatedText: result.translatedText,
      cached: result.cached
    });
  } catch (error) {
    console.error('Translate message error:', error);
    return c.json({ success: false, message: 'Translation failed' }, 500);
  }
});

r.get('/search', async (c: Context) => {
  try {
    const userId = (c.get('auth') as any).userId;
    const query = c.req.query('q') || '';
    const contentType = c.req.query('type');
    const dateFrom = c.req.query('from');
    const dateTo = c.req.query('to');
    const conversationId = c.req.query('conversationId');
    const limit = Number(c.req.query('limit') || 50);
    const offset = Number(c.req.query('offset') || 0);

    if (!query || query.length < 2) {
      return c.json({ success: false, message: 'Search query too short' }, 400);
    }

    let whereConditions = [
      `cp.user_id = $1`,
      `(m.body ILIKE $2 OR u.name ILIKE $2)`
    ];
    const params: any[] = [userId, `%${query}%`];
    let paramIndex = 3;

    if (contentType) {
      whereConditions.push(`m.kind = ${paramIndex}`);
      params.push(contentType);
      paramIndex++;
    }

    if (dateFrom) {
      whereConditions.push(`m.created_at >= ${paramIndex}`);
      params.push(dateFrom);
      paramIndex++;
    }

    if (dateTo) {
      whereConditions.push(`m.created_at <= ${paramIndex}`);
      params.push(dateTo);
      paramIndex++;
    }

    if (conversationId) {
      whereConditions.push(`m.conversation_id = ${paramIndex}`);
      params.push(conversationId);
      paramIndex++;
    }

    const searchResults = await q(
      `SELECT 
        m.id,
        m.body,
        m.kind,
        m.created_at,
        m.conversation_id,
        m.sender_id,
        json_build_object(
          'id', u.id,
          'name', u.name,
          'avatar_url', up.avatar_url
        ) as sender,
        json_build_object(
          'id', c.id,
          'type', c.type,
          'title', c.title
        ) as conversation,
        CASE WHEN m.media_id IS NOT NULL THEN
          json_build_object(
            'id', med.id,
            'type', med.type,
            'url', med.url,
            'thumbnail_url', med.thumbnail_url
          )
        ELSE NULL END as media,
        CASE WHEN m.gift_id IS NOT NULL THEN
          json_build_object(
            'id', g.id,
            'name', g.name,
            'thumbnail_url', g.thumbnail_url
          )
        ELSE NULL END as gift,
        ts_rank(to_tsvector('english', m.body), plainto_tsquery('english', $2)) as rank
      FROM messages m
      JOIN conversations c ON c.id = m.conversation_id
      JOIN conversation_participants cp ON cp.conversation_id = c.id
      JOIN users u ON u.id = m.sender_id
      LEFT JOIN user_profiles up ON up.user_id = u.id
      LEFT JOIN media med ON med.id = m.media_id
      LEFT JOIN gifts g ON g.id = m.gift_id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY rank DESC, m.created_at DESC
      LIMIT ${paramIndex} OFFSET ${paramIndex + 1}`,
      [...params, limit, offset]
    );

    const totalResult = await q(
      `SELECT COUNT(*) as total
       FROM messages m
       JOIN conversations c ON c.id = m.conversation_id
       JOIN conversation_participants cp ON cp.conversation_id = c.id
       JOIN users u ON u.id = m.sender_id
       WHERE ${whereConditions.join(' AND ')}`,
      params
    );

    return c.json({ 
      success: true, 
      results: searchResults.rows,
      total: Number(totalResult.rows[0].total),
      query,
      filters: {
        type: contentType,
        dateFrom,
        dateTo,
        conversationId
      }
    });
  } catch (error) {
    console.error('Search messages error:', error);
    return c.json({ success: false, message: 'Search failed' }, 500);
  }
});

export default r;
