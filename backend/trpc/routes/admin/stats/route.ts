import { adminProcedure } from "../../../create-context";
import { pool } from "@/backend/lib/db";

async function safeCount(query: string, label: string): Promise<number> {
  try {
    const res = await pool.query(query);
    const value = parseInt(res.rows[0]?.count ?? "0");
    console.log(`[Admin Stats] ${label} count:`, value);
    return isNaN(value) ? 0 : value;
  } catch (e) {
    console.warn(`[Admin Stats] ${label} count failed, defaulting to 0`, e);
    return 0;
  }
}

async function safeSum(query: string, label: string): Promise<number> {
  try {
    const res = await pool.query(query);
    const value = parseInt(res.rows[0]?.total ?? "0");
    console.log(`[Admin Stats] ${label} sum:`, value);
    return isNaN(value) ? 0 : value;
  } catch (e) {
    console.warn(`[Admin Stats] ${label} sum failed, defaulting to 0`, e);
    return 0;
  }
}

export const adminStatsRoute = adminProcedure.query(async () => {
  console.log("[Admin Stats] Fetching real-time statistics...");

  const [totalUsers, totalMessages, giftsSent, revenueCents] = await Promise.all([
    safeCount("SELECT COUNT(*) as count FROM auth.users", "users"),
    // Optional tables: messages, gift_events may not exist in all deployments
    safeCount("SELECT COUNT(*) as count FROM public.messages", "messages"),
    safeCount("SELECT COUNT(*) as count FROM public.gift_events", "gift_events"),
    safeSum(
      "SELECT COALESCE(SUM(amount_cents), 0) as total FROM public.purchases WHERE status = 'completed'",
      "revenue_cents"
    ),
  ]);

  console.log("[Admin Stats] Stats aggregated:", {
    totalUsers,
    totalMessages,
    giftsSent,
    revenueCents,
  });

  return {
    totalUsers,
    totalMessages,
    giftsSent,
    revenue: revenueCents / 100,
  };
});
