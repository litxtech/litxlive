import { publicProcedure } from '@/backend/trpc/create-context';
import { supabaseServer } from '@/lib/supabaseServer';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';

export const adminLoginRoute = publicProcedure
  .input(
    z.object({
      email: z.string().email(),
      password: z.string().min(6),
    })
  )
  .mutation(async ({ input }) => {
    console.log('[Admin Login] Attempting login for:', input.email);

    const { data, error } = await supabaseServer.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });

    if (error || !data.user) {
      console.error('[Admin Login] Auth error:', error);
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Invalid email or password',
      });
    }

    const { data: adminRole, error: roleError } = await supabaseServer
      .from('admin_roles')
      .select('role, permissions, is_super_admin, is_active')
      .eq('user_id', data.user.id)
      .single();

    if (roleError || !adminRole || !adminRole.is_active) {
      console.error('[Admin Login] Not an admin:', data.user.email);
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'User is not an admin',
      });
    }

    await supabaseServer
      .from('admin_activity_logs')
      .insert({
        admin_user_id: data.user.id,
        action: 'admin_login',
        resource_type: 'auth',
        details: { email: data.user.email },
      });

    console.log('[Admin Login] Success:', data.user.email);

    return {
      user: {
        id: data.user.id,
        email: data.user.email,
        role: adminRole.role,
        permissions: adminRole.permissions,
        isSuperAdmin: adminRole.is_super_admin,
      },
      session: data.session,
    };
  });
