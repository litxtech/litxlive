import { jwtVerify } from "jose";

const ADMIN_COOKIE = process.env.ADMIN_COOKIE_NAME ?? "adm";
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

function json(data: unknown, init?: ResponseInit) {
  const body = data === null ? "null" : JSON.stringify(data);
  const headers = new Headers(init?.headers);
  if (!headers.has("content-type")) headers.set("content-type", "application/json");
  return new Response(body, { ...init, headers });
}

export async function GET(req: Request) {
  const tok = getCookie(req, ADMIN_COOKIE);

  if (!tok) {
    return json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    await jwtVerify(tok, SECRET);
    return json({
      username: "admin",
      is_super_admin: true,
      permissions: { all: true },
    });
  } catch (error) {
    console.error("[admin/me] JWT verification failed:", error);
    return json({ error: "unauthorized" }, { status: 401 });
  }
}
