import { Hono } from 'hono';
import { supabaseServer } from '@/lib/supabaseServer';

const r = new Hono();

r.post('/login', async (c) => {
  try {
    const { email, password } = (await c.req.json().catch(() => ({}))) as {
      email?: string;
      password?: string;
    };

    console.log('[ADMIN AUTH] Attempt', email);

    if (!email || !password) {
      return c.json({ success: false, message: 'Email ve şifre zorunludur' }, 400);
    }

    const { data: authData, error: authError } = await supabaseServer.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      console.log('[ADMIN AUTH] auth error', authError.message);
      return c.json({ success: false, message: 'Geçersiz email veya şifre' }, 401);
    }

    const { data: userData, error: userError } = await supabaseServer
      .from('users')
      .select('id, email, name, user_roles(role_key)')
      .eq('email', email)
      .single();

    if (userError || !userData) {
      console.log('[ADMIN AUTH] user not found', userError);
      return c.json({ success: false, message: 'Kullanıcı bulunamadı' }, 404);
    }

    const roles = (userData as any).user_roles || [];
    const isAdmin = roles.some((r: any) => r?.role_key === 'admin' || r?.role_key === 'owner');

    if (!isAdmin) {
      console.log('[ADMIN AUTH] not admin', userData.email);
      return c.json({ success: false, message: 'Admin erişiminiz yok' }, 403);
    }

    console.log('[ADMIN AUTH] success', userData.email);
    return c.json({ success: true, user: { id: userData.id, email: userData.email, name: (userData as any).name ?? null } });
  } catch (e) {
    console.error('[ADMIN AUTH] error', e);
    return c.json({ success: false, message: 'Sunucu hatası' }, 500);
  }
});

export default r;
