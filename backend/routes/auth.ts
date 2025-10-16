import { Hono } from 'hono';
import type { Context } from 'hono';

const r = new Hono();

r.post('/signup', async (c: Context) => {
  try {
    const body = await c.req.json<{ firstName?: string; lastName?: string; dob?: string; country?: string; city?: string }>();
    console.log('[API] POST /api/auth/signup body', body);

    const { firstName, lastName, dob, country, city } = body ?? {};
    if (!firstName || !lastName || !dob || !country || !city) {
      return c.text('Missing required fields', 400);
    }

    return c.json({ success: true });
  } catch (e) {
    console.error('Signup API error', e);
    return c.text('Internal error', 500);
  }
});

export default r;
