import { Hono } from 'hono';
import { q } from '../lib/db.js';

const r = new Hono();

r.get('/policies', async (c) => {
  const locale = c.req.query('locale') ?? 'tr';
  const rows = await q(
    `SELECT p.slug, COALESCE(f.label, p.footer_label, p.title) AS label
     FROM policies p
     LEFT JOIN footer_items f ON f.policy_id=p.id AND f.locale=$1 AND f.is_active
     WHERE p.show_in_footer = true
     ORDER BY f.order_index ASC NULLS LAST, p.created_at ASC`,
    [locale],
  );
  return c.json({ success: true, items: rows.rows });
});

r.get('/policies/:slug', async (c) => {
  const { slug } = c.req.param();
  const locale = c.req.query('locale') ?? 'tr';
  const res = await q(
    `SELECT pv.version, pv.content_html, pv.effective_at, pv.locale, p.title
     FROM policies p JOIN policy_versions pv ON pv.policy_id=p.id
     WHERE p.slug=$1 AND pv.locale=$2 AND pv.status='published'
     ORDER BY pv.version DESC LIMIT 1`,
    [slug, locale],
  );
  if (!res.rowCount) return c.json({ success: false, message: 'not_found' }, 404);
  return c.json({ success: true, policy: res.rows[0] });
});

r.post('/consents', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as { userId?: string; policy_slug?: string; version?: number; locale?: string };
  const userId = body.userId ?? '';
  const policy_slug = body.policy_slug ?? '';
  const version = body.version;
  const locale = body.locale ?? 'tr';
  if (!userId || !policy_slug || !version) return c.json({ success: false, message: 'bad_request' }, 400);

  const pol = await q<{ id: string }>(`SELECT id FROM policies WHERE slug=$1`, [policy_slug]);
  if (!pol.rowCount) return c.json({ success: false, message: 'policy_not_found' }, 404);
  await q(
    `INSERT INTO policy_acceptances(user_id,policy_id,version,locale,accepted_at,ip,user_agent)
     VALUES ($1,$2,$3,$4,now(),$5,$6)
     ON CONFLICT (user_id,policy_id,version) DO NOTHING`,
    [userId, pol.rows[0].id, version, locale, c.req.header('x-forwarded-for') ?? null, c.req.header('user-agent') ?? null],
  );
  return c.json({ success: true });
});

export default r;
