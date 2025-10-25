const ADMIN_COOKIE = process.env.ADMIN_COOKIE_NAME ?? "adm";

function json(data: unknown, init?: ResponseInit) {
  const body = data === null ? "null" : JSON.stringify(data);
  const headers = new Headers(init?.headers);
  if (!headers.has("content-type")) headers.set("content-type", "application/json");
  return new Response(body, { ...init, headers });
}

export async function POST() {
  const headers = new Headers({ "content-type": "application/json" });
  headers.append("set-cookie", `${ADMIN_COOKIE}=; Path=/; Max-Age=0`);
  return new Response(JSON.stringify({ success: true }), { status: 200, headers });
}

// Default export for Expo Router
export default function AdminLogoutRoute() {
  return null;
}