// @ts-nocheck
/* eslint-disable */
/* admin-working – yalnız Vercel proxy içeri girer */
// deno-lint-ignore-file no-explicit-any
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function json(data: unknown, status = 200, headers?: HeadersInit) {
  const h = new Headers({ "content-type": "application/json", ...(headers || {}) });
  return new Response(JSON.stringify(data), { status, headers: h });
}
function isFromVercelProxy(req: Request) {
  const auth = req.headers.get("Authorization") || "";
  return auth === `Bearer ${SERVICE_KEY}`;
}
function subPathAfter(fnName: string, url: URL) {
  let p = url.pathname;
  const i = p.indexOf(`/${fnName}`);
  if (i >= 0) p = p.slice(i + (`/${fnName}`).length).replace(/^\/+/, "");
  return p.replace(/\/+$/, "");
}

Deno.serve(async (req: Request) => {
  const u = new URL(req.url);
  const p = subPathAfter("admin-working", u);

  if (req.method === "GET" && (p === "" || p === "health")) {
    return json({ ok: true, service: "admin-working", time: new Date().toISOString() });
  }

  if (!isFromVercelProxy(req)) return json({ error: "unauthorized" }, 401);

  if (req.method === "GET" && p === "logs") {
    const limit = Number(u.searchParams.get("limit") ?? "100");
    const items = Array.from({ length: Math.min(isFinite(limit) ? limit : 100, 5) }).map((_, i) => ({
      id: `log-${i + 1}`, level: "info", message: `Sample log ${i + 1}`,
      createdAt: new Date().toISOString(), context: { ip: "127.0.0.1" },
    }));
    return json({ items });
  }

  if (req.method === "GET" && p === "footer") {
    return json({ html: "<p>© LITXTECH</p>", links: [{ label: "Privacy", href: "/privacy" }], updatedAt: new Date().toISOString() });
  }

  if (req.method === "GET" && p === "agencies") {
    const status = u.searchParams.get("status") ?? "pending";
    const limit = Number(u.searchParams.get("limit") ?? "100");
    const agencies = Array.from({ length: Math.min(isFinite(limit) ? limit : 100, 10) }).map((_, i) => ({
      id: `agency-${i + 1}`,
      name: `Agency ${i + 1}`,
      status,
      createdAt: new Date().toISOString(),
    }));
    return json({ items: agencies });
  }

  if (req.method === "POST" && p.startsWith("agencies/") && p.endsWith("/status")) {
    const body = await req.json().catch(() => ({} as any));
    const parts = p.split("/");
    const id = parts[1];
    const status = body?.status ?? "approved";
    if (!id) return json({ error: "invalid id" }, 400);
    return json({ id, status, updatedAt: new Date().toISOString() });
  }

  return json({ error: "not_found" }, 404);
});
