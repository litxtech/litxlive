import type { Context, Next } from 'hono';

export function requireRole(roles: string[]) {
  return async (c: Context, next: Next) => {
    const claims = c.get('auth') as { roles?: string[]; role?: string } | undefined;
    if (!claims) return c.json({ success: false, message: 'unauthorized' }, 401);
    
    const userRoles: string[] = [];
    if (claims.roles) {
      userRoles.push(...claims.roles);
    }
    if (claims.role) {
      userRoles.push(claims.role);
    }
    
    const ok = userRoles.some((r) => roles.includes(r));
    if (!ok) {
      console.log('[RBAC] Access denied. Required roles:', roles, 'User roles:', userRoles);
      return c.json({ success: false, message: 'forbidden' }, 403);
    }
    
    console.log('[RBAC] Access granted. User roles:', userRoles);
    await next();
  };
}
