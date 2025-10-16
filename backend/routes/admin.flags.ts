import { Hono } from 'hono';
import { auth } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/rbac.js';
import { q } from '../lib/db.js';

const r = new Hono();

r.use('*', auth(), requireRole(['owner', 'admin']));

r.get('/', async (c) => {
  const rows = await q(`SELECT key, value, updated_at FROM feature_flags ORDER BY key`);
  return c.json({ success: true, items: rows.rows });
});

r.post('/:key', async (c) => {
  const { key } = c.req.param();
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  await q(
    `INSERT INTO feature_flags(key,value,updated_by,updated_at)
     VALUES ($1,$2,$3,now())
     ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value, updated_by=EXCLUDED.updated_by, updated_at=now()`,
    [key, body, (((c as unknown) as any).get?.('auth')?.userId ?? null)],
  );
  return c.json({ success: true });
});

export default r;
