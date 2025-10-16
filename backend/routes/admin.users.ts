import { Hono } from 'hono';
import { auth } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/rbac.js';
import { q } from '../lib/db.js';
import { audit } from '../lib/audit.js';

const r = new Hono();

r.use('*', auth());

r.get('/', requireRole(['owner', 'admin', 'moderator', 'support', 'finance', 'readonly']), async (c) => {
  const search = c.req.query('search') ?? '';
  const status = c.req.query('status') ?? '';
  const limit = Number(c.req.query('limit') ?? 20);
  const offset = Number(c.req.query('offset') ?? 0);

  const rows = await q(
    `SELECT u.id,u.email,u.name,u.status,u.created_at,
            p.blue_tick, p.kyc_status
     FROM users u
     LEFT JOIN user_profiles p ON p.user_id=u.id
     WHERE ($1='' OR u.email ILIKE '%'||$1||'%' OR u.name ILIKE '%'||$1||'%')
       AND ($2='' OR u.status=$2)
     ORDER BY u.created_at DESC
     LIMIT $3 OFFSET $4`,
    [search, status, limit, offset],
  );
  return c.json({ success: true, items: rows.rows });
});

r.get('/:id', requireRole(['owner', 'admin', 'moderator', 'support', 'finance', 'readonly']), async (c) => {
  const { id } = c.req.param();
  const user = await q(
    `SELECT u.*, p.blue_tick, p.kyc_status, p.badges
     FROM users u LEFT JOIN user_profiles p ON p.user_id=u.id
     WHERE u.id=$1`,
    [id],
  );
  if (!user.rowCount) return c.json({ success: false, message: 'not found' }, 404);
  return c.json({ success: true, user: user.rows[0] });
});

r.post('/:id/ban', requireRole(['owner', 'admin']), async (c) => {
  const { id } = c.req.param();
  const body = (await c.req.json().catch(() => ({}))) as { reason?: string };
  await q(`UPDATE users SET status='banned' WHERE id=$1`, [id]);
  await audit(((c as unknown) as any).get?.('auth')?.userId as string, 'ban_user', 'user', id, { reason: body?.reason ?? 'manual' }, c.req.header('x-forwarded-for') ?? undefined, c.req.header('user-agent') ?? undefined);
  return c.json({ success: true });
});

r.post('/:id/unban', requireRole(['owner', 'admin']), async (c) => {
  const { id } = c.req.param();
  await q(`UPDATE users SET status='active' WHERE id=$1`, [id]);
  await audit(((c as unknown) as any).get?.('auth')?.userId as string, 'unban_user', 'user', id);
  return c.json({ success: true });
});

r.post('/:id/blue-tick', requireRole(['owner', 'admin']), async (c) => {
  const { id } = c.req.param();
  const data = (await c.req.json().catch(() => ({ value: true }))) as { value?: boolean };
  const value = data?.value ?? true;
  await q(
    `INSERT INTO user_profiles(user_id, blue_tick)
     VALUES ($1,$2)
     ON CONFLICT (user_id) DO UPDATE SET blue_tick=EXCLUDED.blue_tick`,
    [id, !!value],
  );
  await audit(((c as unknown) as any).get?.('auth')?.userId as string, value ? 'grant_blue_tick' : 'revoke_blue_tick', 'user', id);
  return c.json({ success: true });
});

export default r;
