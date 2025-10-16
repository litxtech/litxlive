import { z } from 'zod';
import { createTRPCRouter, publicProcedure, protectedProcedure, adminProcedure } from '@/backend/trpc/create-context';
import { q } from '@/backend/lib/db';

const PolicySchema = z.object({
  id: z.string().uuid(),
  base_slug: z.string().nullable(),
  slug: z.string(),
  locale: z.string(),
  category: z.string().nullable(),
  title: z.string(),
  body_md: z.string(),
  status: z.enum(['draft','published','archived']),
  version: z.number(),
  show_on_login: z.boolean().nullable().transform(v => Boolean(v)),
  required_ack: z.boolean().nullable().transform(v => Boolean(v)),
  show_in_app: z.boolean().nullable().transform(v => Boolean(v)),
  show_in_footer: z.boolean().nullable().transform(v => Boolean(v)),
  sort_order: z.number().nullable().transform(v => v ?? 100),
  valid_from: z.string().nullable(),
  valid_to: z.string().nullable(),
  published_at: z.string().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});

export const policiesRouter = createTRPCRouter({
  listPublic: publicProcedure.input(z.object({ locale: z.string().optional() }).optional()).query(async ({ input }) => {
    const locale = input?.locale ?? 'en';
    const { rows } = await q(`
      select * from public.policies
      where status = 'published' and locale = $1 and show_in_app = true
      order by sort_order asc, title asc
    `, [locale]);
    return rows.map(r => PolicySchema.parse(r));
  }),

  listFooter: publicProcedure.input(z.object({ locale: z.string().optional() }).optional()).query(async ({ input }) => {
    const locale = input?.locale ?? 'en';
    const { rows } = await q(`
      select slug, title from public.policies
      where status = 'published' and locale = $1 and show_in_footer = true
      order by sort_order asc, title asc
    `, [locale]);
    return rows as { slug: string; title: string }[];
  }),

  getBySlug: publicProcedure.input(z.object({ slug: z.string(), locale: z.string().optional() })).query(async ({ input }) => {
    const locale = input.locale ?? 'en';
    const { rows } = await q(`
      select * from public.policies
      where slug = $1 and locale = $2 and status = 'published'
      limit 1
    `, [input.slug, locale]);
    if (!rows[0]) return null;
    return PolicySchema.parse(rows[0]);
  }),

  pendingForUser: protectedProcedure.input(z.object({ locale: z.string().optional() }).optional()).query(async ({ ctx, input }) => {
    const locale = input?.locale ?? 'en';
    const { rows } = await q(`
      select p.* from public.policies p
      left join public.policy_acknowledgements a
        on a.policy_id = p.id and a.user_id = $1 and a.version = p.version
      where p.status = 'published' and p.locale = $2 and p.required_ack = true and a.user_id is null
      order by p.sort_order asc
    `, [ctx.user!.id, locale]);
    return rows.map(r => PolicySchema.parse(r));
  }),

  acknowledge: protectedProcedure.input(z.object({ policyId: z.string().uuid(), version: z.number() })).mutation(async ({ ctx, input }) => {
    await q(`
      insert into public.policy_acknowledgements (user_id, policy_id, version)
      values ($1, $2, $3) on conflict do nothing
    `, [ctx.user!.id, input.policyId, input.version]);
    return { ok: true } as const;
  }),

  // Admin operations
  adminListAll: adminProcedure.input(z.object({ locale: z.string().optional(), status: z.enum(['draft','published','archived']).optional() }).optional()).query(async ({ input }) => {
    const locale = input?.locale ?? 'en';
    const status = input?.status;
    const params: any[] = [locale];
    let where = 'where locale = $1';
    if (status) { where += ' and status = $2'; params.push(status); }
    const { rows } = await q(`select * from public.policies ${where} order by updated_at desc`, params);
    return rows.map(r => PolicySchema.parse(r));
  }),

  adminCreate: adminProcedure.input(z.object({
    base_slug: z.string().optional(),
    slug: z.string().optional(),
    locale: z.string().default('en'),
    category: z.string().optional(),
    title: z.string(),
    body_md: z.string(),
    show_on_login: z.boolean().optional(),
    required_ack: z.boolean().optional(),
    show_in_app: z.boolean().optional(),
    show_in_footer: z.boolean().optional(),
    sort_order: z.number().optional(),
    valid_from: z.string().optional(),
    valid_to: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const { rows } = await q(`
      insert into public.policies (base_slug, slug, locale, category, title, body_md, show_on_login, required_ack, show_in_app, show_in_footer, sort_order, valid_from, valid_to, status, created_by, updated_by)
      values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'draft',$14,$14)
      returning *
    `, [
      input.base_slug ?? null,
      input.slug ?? null,
      input.locale ?? 'en',
      input.category ?? null,
      input.title,
      input.body_md,
      input.show_on_login ?? false,
      input.required_ack ?? false,
      input.show_in_app ?? true,
      input.show_in_footer ?? true,
      input.sort_order ?? 100,
      input.valid_from ?? null,
      input.valid_to ?? null,
      ctx.admin!.id,
    ]);
    return PolicySchema.parse(rows[0]);
  }),

  adminUpdate: adminProcedure.input(z.object({
    id: z.string().uuid(),
    title: z.string().optional(),
    body_md: z.string().optional(),
    category: z.string().optional(),
    show_on_login: z.boolean().optional(),
    required_ack: z.boolean().optional(),
    show_in_app: z.boolean().optional(),
    show_in_footer: z.boolean().optional(),
    sort_order: z.number().optional(),
    valid_from: z.string().optional(),
    valid_to: z.string().optional(),
    status: z.enum(['draft','published','archived']).optional(),
  })).mutation(async ({ ctx, input }) => {
    const fields: string[] = [];
    const params: any[] = [];
    let idx = 1;
    for (const [k, v] of Object.entries(input)) {
      if (k === 'id') continue;
      fields.push(`${k} = $${idx++}`);
      params.push(v);
    }
    params.push(ctx.admin!.id);
    params.push(input.id);
    const setSql = fields.length ? fields.join(', ') + ', updated_by = $' + (idx++) : 'updated_by = $1';
    const { rows } = await q(`update public.policies set ${setSql} where id = $${idx} returning *`, params);
    return PolicySchema.parse(rows[0]);
  }),

  adminPublish: adminProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ ctx, input }) => {
    const { rows } = await q(`
      update public.policies set status = 'published', published_at = now(), updated_by = $2 where id = $1 returning *
    `, [input.id, ctx.admin!.id]);
    return PolicySchema.parse(rows[0]);
  }),

  adminArchive: adminProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ ctx, input }) => {
    const { rows } = await q(`
      update public.policies set status = 'archived', updated_by = $2 where id = $1 returning *
    `, [input.id, ctx.admin!.id]);
    return PolicySchema.parse(rows[0]);
  }),

  adminDelete: adminProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ input }) => {
    await q(`delete from public.policies where id = $1`, [input.id]);
    return { ok: true } as const;
  }),

  adminHistory: adminProcedure.input(z.object({ base_slug: z.string() })).query(async ({ input }) => {
    const { rows } = await q(`
      select * from public.policies_history where base_slug = $1 order by archived_at desc
    `, [input.base_slug]);
    return rows.map(r => PolicySchema.parse(r));
  }),
});

export type PoliciesRouter = typeof policiesRouter;
