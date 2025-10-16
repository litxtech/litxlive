import type { Context, Next } from 'hono';
import { supabaseServer } from '@/lib/supabaseServer';

export function auth() {
  return async (c: Context, next: Next) => {
    try {
      const header = c.req.header('authorization') ?? '';
      const token = header.startsWith('Bearer ') ? header.slice(7) : '';
      
      if (!token) {
        return c.json({ success: false, message: 'unauthorized' }, 401);
      }

      const { data: { user }, error } = await supabaseServer.auth.getUser(token);

      if (error || !user) {
        console.error('[auth] Supabase auth error:', error);
        return c.json({ success: false, message: 'invalid_token' }, 401);
      }

      console.log('[auth] User authenticated:', user.id);
      c.set('auth', {
        userId: user.id,
        email: user.email,
      });
      
      await next();
    } catch (e) {
      console.error('[auth] error', e);
      return c.json({ success: false, message: 'invalid_token' }, 401);
    }
  };
}
