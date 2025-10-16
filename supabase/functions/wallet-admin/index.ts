// @ts-nocheck
/* eslint-disable */
/* wallet-admin – yalnız Vercel proxy içeri girer */
// deno-lint-ignore-file no-explicit-any
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ADMIN_COOKIE_NAME = Deno.env.get("ADMIN_COOKIE_NAME") ?? "adm";
const ALLOWED = (Deno.env.get("ADMIN_ALLOWED_ORIGINS") ?? "https://www.litxtechuk.com,https://litxtechuk.com")
  .split(",").map((s: string) => s.trim()).filter(Boolean);

const sb = createClient(SUPABASE_URL, SERVICE_KEY);

function cors(origin: string | null) {
  const o = origin && ALLOWED.includes(origin) ? origin : ALLOWED[0];
  const h = new Headers();
  h.set("Access-Control-Allow-Origin", o);
  h.set("Access-Control-Allow-Credentials", "true");
  h.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  h.set("Access-Control-Allow-Headers", "Authorization, Content-Type, Accept, Idempotency-Key");
  h.set("Vary", "Origin");
  h.set("Access-Control-Max-Age", "600");
  return h;
}
function asJson(h: Headers, body: unknown, status = 200) {
  const hh = new Headers(h);
  hh.set("Content-Type", "application/json");
  return new Response(JSON.stringify(body), { status, headers: hh });
}
function isFromVercelProxy(req: Request) {
  const auth = req.headers.get("Authorization") || "";
  return auth === `Bearer ${SERVICE_KEY}`;
}
function normalize(pathname: string) { return pathname.replace(/\/+$/, ""); }
function uuidOk(u: string) { return !!u && /^[0-9a-f-]{36}$/i.test(u); }

Deno.serve(async (req: Request) => {
  const headers = cors(req.headers.get("Origin"));
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });

  const url = new URL(req.url);
  const path = normalize(url.pathname);

  // Health: proxy'siz de cevap ver (operasyonel kontrol)
  if (req.method === "GET" && /\/wallet-admin(\/health)?$/.test(path)) {
    return asJson(headers, { ok: true, service: "wallet-admin", time: new Date().toISOString() });
  }

  // Sadece Vercel proxy
  if (!isFromVercelProxy(req)) return asJson(headers, { error: "unauthorized" }, 401);

  try {
    if (req.method === "GET" && path.endsWith("/wallet/balance")) {
      const user_id = url.searchParams.get("user_id") || "";
      if (!uuidOk(user_id)) return asJson(headers, { error: "user_id invalid" }, 400);
      const { data, error } = await sb.from("user_balances").select("*").eq("user_id", user_id).maybeSingle();
      if (error) return asJson(headers, { error: error.message }, 500);
      return asJson(headers, { user_id, balance: data?.balance ?? 0 });
    }

    if (req.method === "GET" && path.endsWith("/wallet/ledger")) {
      const user_id = url.searchParams.get("user_id") || "";
      const limit = Number(url.searchParams.get("limit") || "50");
      if (!uuidOk(user_id)) return asJson(headers, { error: "user_id invalid" }, 400);
      const { data, error } = await sb.from("wallet_ledger").select("*")
        .eq("user_id", user_id).order("created_at", { ascending: false })
        .limit(isFinite(limit) ? Math.min(limit, 200) : 50);
      if (error) return asJson(headers, { error: error.message }, 500);
      return asJson(headers, { items: data });
    }

    if (req.method === "POST" && path.endsWith("/wallet/credit")) {
      const body = await req.json().catch(() => ({} as any));
      const { user_id, amount, reason = "manual_credit", meta = {}, idem } = body || {};
      if (!uuidOk(user_id) || !Number.isInteger(amount) || amount <= 0) return asJson(headers, { error: "invalid payload" }, 400);
      const idemKey = req.headers.get("Idempotency-Key") || idem || crypto.randomUUID();
      const { data, error } = await sb.rpc("wallet_credit", { p_user: user_id, p_amount: amount, p_reason: reason, p_idem: idemKey, p_meta: meta });
      if (error) return asJson(headers, { error: error.message }, 400);
      return asJson(headers, { success: true, entry: data });
    }

    if (req.method === "POST" && path.endsWith("/wallet/debit")) {
      const body = await req.json().catch(() => ({} as any));
      const { user_id, amount, reason = "manual_debit", meta = {}, idem } = body || {};
      if (!uuidOk(user_id) || !Number.isInteger(amount) || amount <= 0) return asJson(headers, { error: "invalid payload" }, 400);
      const idemKey = req.headers.get("Idempotency-Key") || idem || crypto.randomUUID();
      const { data, error } = await sb.rpc("wallet_debit", { p_user: user_id, p_amount: amount, p_reason: reason, p_idem: idemKey, p_meta: meta });
      if (error) return asJson(headers, { error: error.message }, 400);
      return asJson(headers, { success: true, entry: data });
    }

    if (req.method === "POST" && path.endsWith("/wallet/transfer")) {
      const body = await req.json().catch(() => ({} as any));
      const { from_user_id, to_user_id, amount, idem, meta = {} } = body || {};
      if (!uuidOk(from_user_id) || !uuidOk(to_user_id) || !Number.isInteger(amount) || amount <= 0) return asJson(headers, { error: "invalid payload" }, 400);
      const idemKey = req.headers.get("Idempotency-Key") || idem || crypto.randomUUID();
      const { data, error } = await sb.rpc("wallet_transfer", { p_from: from_user_id, p_to: to_user_id, p_amount: amount, p_idem: idemKey, p_meta: meta });
      if (error) return asJson(headers, { error: error.message }, 400);
      return asJson(headers, { success: true, result: data });
    }

    if (req.method === "POST" && path.endsWith("/wallet/settle-call")) {
      const body = await req.json().catch(() => ({} as any));
      const { user_id, call_id, minutes, price_per_min } = body || {};
      if (!uuidOk(user_id) || !uuidOk(call_id) || !Number.isInteger(minutes) || !Number.isInteger(price_per_min))
        return asJson(headers, { error: "invalid payload" }, 400);
      const { data, error } = await sb.rpc("wallet_settle_call", { p_user: user_id, p_call_id: call_id, p_minutes: minutes, p_price_per_min: price_per_min });
      if (error) return asJson(headers, { error: error.message }, 400);
      return asJson(headers, { success: true, entry: data });
    }

    return asJson(headers, { error: "not_found" }, 404);
  } catch (e) {
    return asJson(headers, { error: "server_error", detail: String(e) }, 500);
  }
});
