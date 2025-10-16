import { Context, Next } from 'hono';
import { supabaseServer } from '../../lib/supabaseServer.js';

type User = {
  id: string;
  email: string | undefined;
  displayName: string;
  emailVerified: boolean;
};

export type SupabaseAuthVariables = {
  user: User;
};

export async function supabaseAuthMiddleware(c: Context<{ Variables: SupabaseAuthVariables }>, next: Next) {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized', message: 'Missing or invalid authorization header' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');

    const { data: { user }, error } = await supabaseServer.auth.getUser(token);

    if (error || !user) {
      console.error('[SupabaseAuth] Invalid token:', error);
      return c.json({ error: 'Unauthorized', message: 'Invalid or expired token' }, 401);
    }

    c.set('user', {
      id: user.id,
      email: user.email,
      displayName: user.user_metadata?.display_name || user.email?.split('@')[0],
      emailVerified: user.email_confirmed_at !== null,
    });

    await next();
  } catch (error) {
    console.error('[SupabaseAuth] Middleware error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
}

export async function optionalSupabaseAuth(c: Context<{ Variables: Partial<SupabaseAuthVariables> }>, next: Next) {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error } = await supabaseServer.auth.getUser(token);

      if (!error && user) {
        c.set('user', {
          id: user.id,
          email: user.email,
          displayName: user.user_metadata?.display_name || user.email?.split('@')[0],
          emailVerified: user.email_confirmed_at !== null,
        });
      }
    }

    await next();
  } catch (error) {
    console.error('[SupabaseAuth] Optional middleware error:', error);
    await next();
  }
}
