import { Hono } from 'hono';
import { auth } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/rbac.js';
import { q } from '../lib/db.js';
import { audit } from '../lib/audit.js';

const r = new Hono();

r.use('*', auth(), requireRole(['owner', 'admin']));

r.get('/', async (c) => {
  const policies = await q(
    `SELECT 
      p.id, p.slug, p.title, p.footer_label, p.show_in_footer, p.created_at,
      json_build_object(
        'version', pv.version,
        'content_html', pv.content_html,
        'locale', pv.locale
      ) as latest_version
    FROM policies p
    LEFT JOIN LATERAL (
      SELECT version, content_html, locale
      FROM policy_versions
      WHERE policy_id = p.id AND status = 'published'
      ORDER BY version DESC
      LIMIT 1
    ) pv ON true
    ORDER BY p.created_at DESC`
  );
  return c.json({ success: true, policies: policies.rows });
});

r.post('/', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as { slug?: string; title?: string; footer_label?: string; show_in_footer?: boolean };
  const slug = body.slug ?? '';
  const title = body.title ?? '';
  const footer_label = body.footer_label ?? null;
  const show_in_footer = body.show_in_footer ?? true;
  if (!slug || !title) return c.json({ success: false, message: 'slug and title required' }, 400);

  const res = await q(
    `INSERT INTO policies(slug,title,footer_label,show_in_footer,created_by)
     VALUES ($1,$2,$3,$4,$5)
     RETURNING id`,
    [slug, title, footer_label, show_in_footer, (((c as unknown) as any).get?.('auth')?.userId ?? null)],
  );
  const id = res.rows[0].id as string;
  await audit((((c as unknown) as any).get?.('auth')?.userId as string), 'create_policy', 'policy', id, { slug, title });
  return c.json({ success: true, id });
});

r.put('/:slug/update', async (c) => {
  const { slug } = c.req.param();
  const body = (await c.req.json().catch(() => ({}))) as { title?: string; content_html?: string };
  const title = body.title ?? '';
  const content_html = body.content_html ?? '';
  
  if (!title || !content_html) return c.json({ success: false, message: 'title and content_html required' }, 400);

  const policy = await q<{ id: string }>(`SELECT id FROM policies WHERE slug=$1`, [slug]);
  if (!policy.rowCount) return c.json({ success: false, message: 'policy_not_found' }, 404);

  await q(`UPDATE policies SET title=$1 WHERE slug=$2`, [title, slug]);

  const ver = await q<{ v: number }>(`SELECT COALESCE(MAX(version),0)+1 AS v FROM policy_versions WHERE policy_id=$1 AND locale='en'`, [policy.rows[0].id]);
  const version = Number(ver.rows[0].v);

  await q(
    `INSERT INTO policy_versions(policy_id,version,locale,content_markdown,content_html,status,created_by)
     VALUES ($1,$2,'en',$3,$4,'published',$5)`,
    [policy.rows[0].id, version, content_html, content_html, (((c as unknown) as any).get?.('auth')?.userId ?? null)]
  );

  await q(`UPDATE policy_versions SET status='archived' WHERE policy_id=$1 AND locale='en' AND version<>$2 AND status='published'`, [policy.rows[0].id, version]);

  await audit((((c as unknown) as any).get?.('auth')?.userId as string), 'update_policy', 'policy', policy.rows[0].id, { slug, title });
  return c.json({ success: true });
});

r.delete('/:slug', async (c) => {
  const { slug } = c.req.param();
  
  const policy = await q<{ id: string }>(`SELECT id FROM policies WHERE slug=$1`, [slug]);
  if (!policy.rowCount) return c.json({ success: false, message: 'policy_not_found' }, 404);

  await q(`DELETE FROM policy_versions WHERE policy_id=$1`, [policy.rows[0].id]);
  await q(`DELETE FROM policies WHERE id=$1`, [policy.rows[0].id]);

  await audit((((c as unknown) as any).get?.('auth')?.userId as string), 'delete_policy', 'policy', policy.rows[0].id, { slug });
  return c.json({ success: true });
});

r.get('/:slug', async (c) => {
  const { slug } = c.req.param();
  const policy = await q(
    `SELECT 
      p.id, p.slug, p.title, p.footer_label, p.show_in_footer, p.created_at,
      json_build_object(
        'version', pv.version,
        'content_html', pv.content_html,
        'locale', pv.locale
      ) as latest_version
    FROM policies p
    LEFT JOIN LATERAL (
      SELECT version, content_html, locale
      FROM policy_versions
      WHERE policy_id = p.id AND status = 'published'
      ORDER BY version DESC
      LIMIT 1
    ) pv ON true
    WHERE p.slug = $1`,
    [slug]
  );
  if (!policy.rowCount) return c.json({ success: false, message: 'policy_not_found' }, 404);
  return c.json({ success: true, policy: policy.rows[0] });
});

r.post('/:id/versions', async (c) => {
  const { id } = c.req.param();
  const body = (await c.req.json().catch(() => ({}))) as {
    locale?: string;
    content_markdown?: string;
    effective_at?: string | null;
    require_reconsent?: boolean;
    publish?: boolean;
  };
  const locale = body.locale ?? 'tr';
  const content_markdown = body.content_markdown ?? '';
  if (!content_markdown) return c.json({ success: false, message: 'content_markdown required' }, 400);
  const effective_at = body.effective_at ?? null;
  const require_reconsent = !!body.require_reconsent;
  const publish = !!body.publish;

  const ver = await q<{ v: number }>(`SELECT COALESCE(MAX(version),0)+1 AS v FROM policy_versions WHERE policy_id=$1 AND locale=$2`, [id, locale]);
  const version = Number(ver.rows[0].v);

  const ins = await q(
    `INSERT INTO policy_versions(policy_id,version,locale,content_markdown,content_html,effective_at,require_reconsent,status,created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING id`,
    [id, version, locale, content_markdown, content_markdown, effective_at, require_reconsent, publish ? 'published' : 'draft', (((c as unknown) as any).get?.('auth')?.userId ?? null)],
  );
  const vid = ins.rows[0].id as string;

  if (publish) {
    await q(`UPDATE policy_versions SET status='archived' WHERE policy_id=$1 AND locale=$2 AND version<>$3 AND status='published'`, [id, locale, version]);
    if (require_reconsent) {
      await q(
        `INSERT INTO feature_flags(key,value,updated_by,updated_at)
         VALUES ('require_reconsent', $1, $2, now())
         ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value, updated_by=EXCLUDED.updated_by, updated_at=now()`,
        [JSON.stringify({ policy_id: id, locale, version }), (((c as unknown) as any).get?.('auth')?.userId ?? null)],
      );
    }
    await audit((((c as unknown) as any).get?.('auth')?.userId as string), 'publish_policy', 'policy_version', vid, { version, locale });
  }

  return c.json({ success: true, version });
});

export default r;
