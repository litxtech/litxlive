import { SignJWT } from "jose";

const ADMIN_USER = process.env.ADMIN_USER!;
const ADMIN_PASS = process.env.ADMIN_PASS!;
const ADMIN_COOKIE = process.env.ADMIN_COOKIE_NAME ?? "adm";
const SECRET = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET!);

function json(data: unknown, init?: ResponseInit) {
  const body = data === null ? "null" : JSON.stringify(data);
  const headers = new Headers(init?.headers);
  if (!headers.has("content-type")) headers.set("content-type", "application/json");
  return new Response(body, { ...init, headers });
}

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json().catch(() => ({} as any));

    const ok =
      (username === ADMIN_USER || username === "support@litxtech.com") &&
      password === ADMIN_PASS;

    if (!ok) {
      return json({ error: "Invalid credentials" }, { status: 401 });
    }

    const jwt = await new SignJWT({ u: "admin" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1d")
      .sign(SECRET);

    const headers = new Headers({ "content-type": "application/json" });
    headers.append(
      "set-cookie",
      `${ADMIN_COOKIE}=${encodeURIComponent(jwt)}; Path=/; Max-Age=${60 * 60 * 24}; HttpOnly; SameSite=Lax; Secure`
    );

    return new Response(JSON.stringify({ success: true, username: "admin" }), {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("[admin/login] Error:", error);
    return json({ error: "Server error" }, { status: 500 });
  }
}
