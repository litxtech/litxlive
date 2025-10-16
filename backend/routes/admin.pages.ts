import { Hono } from 'hono';
import { supabaseAuthMiddleware, SupabaseAuthVariables } from '../middlewares/supabaseAuth';
import { requireRole } from '../middlewares/rbac';
import { supabaseServer } from '../../lib/supabaseServer';
import { audit } from '../lib/audit';

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const app = new Hono<{ Variables: SupabaseAuthVariables }>();

app.use('*', supabaseAuthMiddleware);
app.use('*', requireRole(['admin', 'owner']));

app.get('/', async (c) => {
  try {
    const { data: policies, error } = await supabaseServer
      .from('policies')
      .select(`
        id,
        slug,
        title,
        show_in_footer,
        footer_label,
        created_at,
        policy_versions!inner(
          id,
          version,
          locale,
          status,
          effective_at,
          created_at
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const pagesWithLatestVersion = policies?.map((policy: any) => {
      const versions = policy.policy_versions || [];
      const latestVersion = versions.sort((a: any, b: any) => b.version - a.version)[0];
      
      return {
        id: policy.id,
        slug: policy.slug,
        title: policy.title,
        show_in_footer: policy.show_in_footer,
        footer_label: policy.footer_label,
        created_at: policy.created_at,
        latest_version: latestVersion,
        total_versions: versions.length
      };
    });

    return c.json({ pages: pagesWithLatestVersion || [] });
  } catch (error: any) {
    console.error('Error fetching pages:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');

    const { data: policy, error } = await supabaseServer
      .from('policies')
      .select(`
        *,
        policy_versions(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!policy) return c.json({ error: 'Page not found' }, 404);

    return c.json({ page: policy });
  } catch (error: any) {
    console.error('Error fetching page:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.post('/', async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    let { slug, title, content, locale = 'en', show_in_footer = true, footer_label } = body;

    if (!title || !content) {
      return c.json({ error: 'Title and content are required' }, 400);
    }

    if (!slug) {
      slug = generateSlug(title);
    }

    const { data: existingSlug } = await supabaseServer
      .from('policies')
      .select('slug')
      .eq('slug', slug)
      .single();

    if (existingSlug) {
      const timestamp = Date.now();
      slug = `${slug}-${timestamp}`;
    }

    const { data: policy, error: policyError } = await supabaseServer
      .from('policies')
      .insert({
        slug,
        title,
        show_in_footer,
        footer_label: footer_label || title,
        created_by: user.id
      })
      .select()
      .single();

    if (policyError) throw policyError;

    const { data: version, error: versionError } = await supabaseServer
      .from('policy_versions')
      .insert({
        policy_id: policy.id,
        version: 1,
        locale,
        content_markdown: content,
        content_html: content,
        status: 'published',
        effective_at: new Date().toISOString(),
        created_by: user.id
      })
      .select()
      .single();

    if (versionError) throw versionError;

    if (show_in_footer) {
      const { data: footerItems } = await supabaseServer
        .from('footer_items')
        .select('order_index')
        .order('order_index', { ascending: false })
        .limit(1);

      const maxOrder = footerItems?.[0]?.order_index || 0;

      await supabaseServer
        .from('footer_items')
        .insert({
          policy_id: policy.id,
          locale,
          label: footer_label || title,
          order_index: maxOrder + 1,
          is_active: true
        });
    }

    await audit(user.id, 'page.create', 'policy', policy.id, { slug, title });

    return c.json({ page: { ...policy, latest_version: version } }, 201);
  } catch (error: any) {
    console.error('Error creating page:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.put('/:id', async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');
    const body = await c.req.json();
    const { title, content, locale = 'en', show_in_footer, footer_label, create_new_version = false } = body;

    const { data: existingPolicy, error: fetchError } = await supabaseServer
      .from('policies')
      .select('*, policy_versions(*)')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;
    if (!existingPolicy) return c.json({ error: 'Page not found' }, 404);

    const { error: updateError } = await supabaseServer
      .from('policies')
      .update({
        title: title || existingPolicy.title,
        show_in_footer: show_in_footer !== undefined ? show_in_footer : existingPolicy.show_in_footer,
        footer_label: footer_label || existingPolicy.footer_label
      })
      .eq('id', id);

    if (updateError) throw updateError;

    if (content) {
      const versions = existingPolicy.policy_versions || [];
      const latestVersion = versions.sort((a: any, b: any) => b.version - a.version)[0];
      const nextVersion = (latestVersion?.version || 0) + 1;

      if (create_new_version) {
        await supabaseServer
          .from('policy_versions')
          .insert({
            policy_id: id,
            version: nextVersion,
            locale,
            content_markdown: content,
            content_html: content,
            status: 'published',
            effective_at: new Date().toISOString(),
            created_by: user.id
          });
      } else {
        await supabaseServer
          .from('policy_versions')
          .update({
            content_markdown: content,
            content_html: content
          })
          .eq('policy_id', id)
          .eq('version', latestVersion.version)
          .eq('locale', locale);
      }
    }

    if (show_in_footer !== undefined) {
      const { data: footerItem } = await supabaseServer
        .from('footer_items')
        .select('*')
        .eq('policy_id', id)
        .eq('locale', locale)
        .single();

      if (show_in_footer && !footerItem) {
        const { data: footerItems } = await supabaseServer
          .from('footer_items')
          .select('order_index')
          .order('order_index', { ascending: false })
          .limit(1);

        const maxOrder = footerItems?.[0]?.order_index || 0;

        await supabaseServer
          .from('footer_items')
          .insert({
            policy_id: id,
            locale,
            label: footer_label || title || existingPolicy.title,
            order_index: maxOrder + 1,
            is_active: true
          });
      } else if (!show_in_footer && footerItem) {
        await supabaseServer
          .from('footer_items')
          .delete()
          .eq('policy_id', id)
          .eq('locale', locale);
      } else if (show_in_footer && footerItem && footer_label) {
        await supabaseServer
          .from('footer_items')
          .update({ label: footer_label })
          .eq('policy_id', id)
          .eq('locale', locale);
      }
    }

    await audit(user.id, 'page.update', 'policy', id, { title, content: content ? 'updated' : 'unchanged' });

    return c.json({ success: true });
  } catch (error: any) {
    console.error('Error updating page:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.delete('/:id', async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');

    const { data: policy, error: fetchError } = await supabaseServer
      .from('policies')
      .select('slug, title')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;
    if (!policy) return c.json({ error: 'Page not found' }, 404);

    await supabaseServer
      .from('footer_items')
      .delete()
      .eq('policy_id', id);

    const { error: deleteError } = await supabaseServer
      .from('policies')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    await audit(user.id, 'page.delete', 'policy', id, { slug: policy.slug, title: policy.title });

    return c.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting page:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.get('/footer/items', async (c) => {
  try {
    const locale = c.req.query('locale') || 'en';

    const { data: footerItems, error } = await supabaseServer
      .from('footer_items')
      .select(`
        id,
        label,
        order_index,
        is_active,
        policies(id, slug, title)
      `)
      .eq('locale', locale)
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (error) throw error;

    return c.json({ items: footerItems || [] });
  } catch (error: any) {
    console.error('Error fetching footer items:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.put('/footer/reorder', async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const { items } = body;

    if (!Array.isArray(items)) {
      return c.json({ error: 'Items must be an array' }, 400);
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      await supabaseServer
        .from('footer_items')
        .update({ order_index: i })
        .eq('id', item.id);
    }

    await audit(user.id, 'footer.reorder', 'footer_items', 'bulk', { count: items.length });

    return c.json({ success: true });
  } catch (error: any) {
    console.error('Error reordering footer items:', error);
    return c.json({ error: error.message }, 500);
  }
});

export default app;
