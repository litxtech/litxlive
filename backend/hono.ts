import { Hono } from 'hono'
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { appRouter } from './trpc/app-router'
import { createContext } from './trpc/create-context'
import { authRateLimit } from './middlewares/rateLimit'
import { sendTelegramNotification } from '@/lib/telegram'
import { jwtVerify, SignJWT } from 'jose'
import { supabaseAuthMiddleware } from './middlewares/supabaseAuth'
import { supabaseServer } from '@/lib/supabaseServer'

const app = new Hono()
const FEATURE_ADMIN = (process.env.FEATURE_ADMIN ?? 'false') === 'true'

// --- CORS (aynı origin olsak da dursun) ---
const ALLOWED = (process.env.CORS_ALLOWED_ORIGINS ?? 'https://www.litxtechuk.com,https://litxtechuk.com')
  .split(',').map(s => s.trim()).filter(Boolean)
const DEFAULT_ORIGIN = ALLOWED[0]
app.use('/api/*', async (c, next) => {
  const origin = c.req.header('origin') || DEFAULT_ORIGIN
  const allow = ALLOWED.includes(origin) ? origin : DEFAULT_ORIGIN
  if (c.req.method === 'OPTIONS') {
    return c.body(null, 204, {
      'Access-Control-Allow-Origin': allow,
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'authorization, content-type, apikey',
      'Vary': 'Origin',
    })
  }
  await next()
  c.header('Access-Control-Allow-Origin', allow)
  c.header('Access-Control-Allow-Credentials', 'true')
})

// --- helpers ---
const COOKIE = process.env.ADMIN_COOKIE_NAME || 'adm'
const ADMIN_USER = process.env.ADMIN_USER || 'admin'
const ADMIN_PASS = process.env.ADMIN_PASS || 'change-me'
const JWT_SECRET = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET || 'dev-secret')

function setCookie(c: any, name: string, value: string, maxAge = 86400) {
  c.header('Set-Cookie',
    `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`
  , { append: true })
}

async function makeToken(payload: object) {
  return await new SignJWT(payload as any)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('1d')
    .sign(JWT_SECRET)
}

async function hasSession(c: any) {
  const cookie = c.req.header('cookie') || ''
  const fromCookie = (cookie.match(new RegExp(`${COOKIE}=([^;]+)`)) || [])[1] || ''
  const auth = c.req.header('authorization') || ''
  const fromAuth = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  const token = fromAuth || fromCookie
  if (!token) return false
  try {
    await jwtVerify(token, JWT_SECRET) // sadece imzayı kontrol et
    return true
  } catch { return false }
}

// --- base/health ---
app.get('/api', (c) => c.json({ status: 'ok', message: 'API is running' }))
app.get('/api/health', (c) => c.json({ ok: true, ts: Date.now(), domain: process.env.DOMAIN ?? null }))

// --- notify (mevcut kalsın) ---
app.post('/api/notify/telegram', authRateLimit, async (c) => {
  try {
    const body = await c.req.json<{ actionType?: string; user?: { id?: string; email?: string; username?: string } }>()
    const actionType = body?.actionType ?? 'Bildirim'
    const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown'
    const user = body?.user ?? {}
    const res = await sendTelegramNotification({ id: (user as any).id, email: (user as any).email, username: (user as any).username, ip: String(ip) }, actionType)
    if (!(res as any).ok) {
      return c.json({ ok: false, error: (res as any).error ?? 'failed' }, 500)
    }
    return c.json({ ok: true }, 200)
  } catch (e: any) {
    return c.json({ ok: false, error: e?.message ?? 'unknown' }, 500)
  }
})

// --- login (RATE LIMIT OLMADAN) ---
app.post('/api/admin/login', async c => {
  if (!FEATURE_ADMIN) {
    return c.json({ error: 'admin_disabled' }, 410)
  }
  try {
    const { username, password } = await c.req.json().catch(() => ({} as any))
    const okUser = username === ADMIN_USER || username === 'support@litxtech.com'
    const okPass = password === ADMIN_PASS
    if (!okUser || !okPass) {
      return c.json({ error: 'Invalid credentials' }, 401)
    }
    const token = await makeToken({ u: 'admin' })
    setCookie(c, COOKIE, token)
    return c.json({ success: true, username: 'admin', token })
  } catch (e: any) {
    return c.json({ error: 'server_error', detail: String(e) }, 500)
  }
})

// --- me (HER ZAMAN JSON) ---
app.get('/api/admin/me', async c => {
  if (!FEATURE_ADMIN) {
    return c.json({ error: 'admin_disabled' }, 410)
  }
  const ok = await hasSession(c)
  if (!ok) return c.json({ error: 'Unauthorized' }, 401)
  return c.json({ username: 'admin', is_super_admin: true, permissions: { all: true } })
})

// --- optional: logout JSON ---
app.post('/api/admin/logout', async (c) => {
  if (!FEATURE_ADMIN) {
    return c.json({ error: 'admin_disabled' }, 410)
  }
  c.header('Set-Cookie', `${COOKIE}=; Path=/; Max-Age=0`)
  return c.json({ success: true })
})

// --- Supabase proxy ---
const FN = process.env.SUPABASE_FUNCTION_URL!
const SRK = process.env.SUPABASE_SERVICE_ROLE_KEY!
app.all('/api/admin/*', async c => {
  if (!FEATURE_ADMIN) {
    return c.json({ error: 'admin_disabled' }, 410)
  }
  const ok = await hasSession(c)
  if (!ok) return c.json({ error: 'Unauthorized' }, 401)

  const FN_ENV = process.env.SUPABASE_FUNCTION_URL
  const SRK_ENV = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!FN_ENV || !SRK_ENV) {
    return c.json({ error: 'server_misconfig', missing: { SUPABASE_FUNCTION_URL: !FN_ENV, SUPABASE_SERVICE_ROLE_KEY: !SRK_ENV } }, 500)
  }

  try {
    const method = c.req.method
    const url = new URL(c.req.url)
    const tail = url.pathname.replace(/^\/api\/admin\/?/, '')
    const base = tail.startsWith('wallet') ? `${FN_ENV}/functions/v1/wallet-admin` : `${FN_ENV}/functions/v1/admin-working`
    const target = `${base}/${tail}`.replace(/\/+$/, '')

    const body = ['GET','HEAD'].includes(method) ? undefined : await c.req.text()
    const r = await fetch(target + (url.search || ''), {
      method,
      headers: {
        'Content-Type': c.req.header('content-type') || 'application/json',
        'Authorization': `Bearer ${SRK_ENV}`,
        'Accept': 'application/json',
        'x-proxy': 'vercel',
      },
      body,
    })

    const resHeaders = new Headers(r.headers)
    if (!resHeaders.get('content-type')) resHeaders.set('content-type', 'application/json')
    return new Response(await r.text(), { status: r.status, headers: resHeaders })
  } catch (e) {
    return c.json({ error: 'proxy_failed', detail: String(e) }, 502)
  }
})

// --- Account Deletion (auth required) ---
app.post('/api/account/delete', supabaseAuthMiddleware as any, async (c) => {
  try {
    const user = (c as any).get('user') as { id?: string } | undefined
    if (!user?.id) {
      return c.json({ ok: false, error: 'unauthorized' }, 401)
    }

    const { error } = await supabaseServer.auth.admin.deleteUser(user.id)
    if (error) {
      return c.json({ ok: false, error: error.message }, 500)
    }

    return c.json({ ok: true }, 200)
  } catch (e: any) {
    return c.json({ ok: false, error: String(e?.message || e) }, 500)
  }
})

// tRPC endpoint
app.all('/api/trpc/*', (c) => {
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req: c.req.raw,
    router: appRouter,
    createContext,
  })
})

export default app