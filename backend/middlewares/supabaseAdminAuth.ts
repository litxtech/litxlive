import { TRPCError } from '@trpc/server';
import { supabaseServer } from '@/lib/supabaseServer';

export interface AdminUser {
  id: string;
  username: string;
  displayName: string;
  permissions: Record<string, boolean>;
  isSuperAdmin: boolean;
}

export async function verifyAdminAuth(authHeader: string | undefined): Promise<AdminUser> {
  console.log('[verifyAdminAuth] start');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No authorization header' });
  }

  const token = authHeader.replace('Bearer ', '');

  const { data, error } = await supabaseServer.rpc('verify_admin_token', { p_token: token });

  if (error) {
    console.error('[verifyAdminAuth] RPC error', error);
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Token verification failed' });
  }

  const row: any = Array.isArray(data) ? data[0] : data;
  if (!row || !row.is_valid) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid token' });
  }

  return {
    id: row.admin_id as string,
    username: row.username as string,
    displayName: row.display_name as string,
    permissions: (row.permissions as Record<string, boolean>) ?? {},
    isSuperAdmin: !!row.is_super_admin,
  };
}

export async function logAdminActivity(
  adminId: string,
  action: string,
  resourceType?: string,
  resourceId?: string,
  details?: Record<string, unknown>
) {
  try {
    await supabaseServer
      .from('admin_logs')
      .insert({
        admin_id: adminId,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        details,
      });
    console.log('[logAdminActivity] ok', action);
  } catch (error) {
    console.error('[logAdminActivity] fail', error);
  }
}
