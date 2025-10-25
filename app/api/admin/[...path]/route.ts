import { jwtVerify } from "jose";

const FN = process.env.SUPABASE_FUNCTION_URL!;
const SR = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const COOKIE = process.env.ADMIN_COOKIE_NAME ?? "adm";
const SECRET = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET!);

function getCookie(req: Request, name: string): string | undefined {
  const cookie = req.headers.get("cookie") ?? "";
  const parts = cookie.split(/;\s*/);
  for (const p of parts) {
    const [k, ...v] = p.split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return undefined;
}

async function isAdmin(req: Request) {
  const tok = getCookie(req, COOKIE);
  if (!tok) return false;
  try {
    await jwtVerify(tok, SECRET);
    return true;
  } catch {
    return false;
  }
}

function json(data: unknown, init?: ResponseInit) {
  const body = data === null ? "null" : JSON.stringify(data);
  const headers = new Headers(init?.headers);
  if (!headers.has("content-type")) headers.set("content-type", "application/json");
  return new Response(body, { ...init, headers });
}

export async function OPTIONS() {
  return json(null, { status: 200 });
}

export async function GET(req: Request, ctx: { params: { path?: string[] } }) {
  return handle(req, ctx);
}

export async function POST(req: Request, ctx: { params: { path?: string[] } }) {
  return handle(req, ctx);
}

export async function PATCH(req: Request, ctx: { params: { path?: string[] } }) {
  return handle(req, ctx);
}

export async function DELETE(req: Request, ctx: { params: { path?: string[] } }) {
  return handle(req, ctx);
}

async function handle(
  req: Request,
  { params }: { params: { path?: string[] } }
) {
  if (!(await isAdmin(req))) {
    return json({ error: "unauthorized" }, { status: 401 });
  }

  const sub = (params.path ?? []).join("/");
  const url = new URL(req.url);

  const target =
    sub.startsWith("wallet/")
      ? `${FN}/functions/v1/wallet-admin/${sub.replace(/^wallet\//, "")}${url.search}`
      : `${FN}/functions/v1/admin-working/${sub}${url.search}`;

  console.log(`[admin-proxy] ${req.method} ${sub} → ${target}`);

  const init: RequestInit = {
    method: req.method,
    headers: {
      Authorization: `Bearer ${SR}`,
      "Content-Type": req.headers.get("content-type") ?? "application/json",
    },
    body:
      req.method === "GET" || req.method === "HEAD"
        ? undefined
        : await req.text(),
  };

  try {
    const r = await fetch(target, init);
    const body = await r.text();
    const h = new Headers();
    const ct = r.headers.get("content-type");
    if (ct) h.set("content-type", ct);

    return new Response(body, { status: r.status, headers: h });
  } catch (error) {
    console.error(`[admin-proxy] Error:`, error);
    return json({ error: "proxy_error", detail: String(error) }, { status: 500 });
  }
}

// Default export for Expo Router
export default function AdminPathRoute() {
  return null;
}