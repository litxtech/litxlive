import { adminProcedure } from "../../../create-context";
import { pool } from "@/backend/lib/db";

export const adminLiveStatsRoute = adminProcedure.query(async () => {
  console.log("[Admin Live] Fetching live statistics...");

  try {
    const [activeRoomsResult, activeUsersResult, ongoingCallsResult] =
      await Promise.all([
        pool.query(
          `SELECT COUNT(*) as count FROM public.rooms WHERE status = 'active'`
        ),
        pool.query(
          `SELECT COUNT(DISTINCT user_id) as count FROM public.presence WHERE last_seen > NOW() - INTERVAL '5 minutes'`
        ),
        pool.query(
          `SELECT COUNT(*) as count FROM public.video_calls WHERE status = 'ongoing'`
        ),
      ]);

    const activeRooms = parseInt(activeRoomsResult.rows[0]?.count || "0");
    const activeUsers = parseInt(activeUsersResult.rows[0]?.count || "0");
    const ongoingCalls = parseInt(ongoingCallsResult.rows[0]?.count || "0");

    console.log("[Admin Live] Stats:", { activeRooms, activeUsers, ongoingCalls });

    return {
      activeRooms,
      activeUsers,
      ongoingCalls,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("[Admin Live] Error:", error);
    throw new Error("Failed to fetch live statistics");
  }
});

export const adminLiveRoomsRoute = adminProcedure.query(async () => {
  console.log("[Admin Live] Fetching active rooms...");

  try {
    const result = await pool.query(
      `SELECT 
        r.id,
        r.channel_name,
        r.status,
        r.created_at,
        u1.email as host_email,
        u1.raw_user_meta_data->>'full_name' as host_name,
        u2.email as guest_email,
        u2.raw_user_meta_data->>'full_name' as guest_name
      FROM public.rooms r
      LEFT JOIN auth.users u1 ON u1.id = r.host_user_id
      LEFT JOIN auth.users u2 ON u2.id = r.guest_user_id
      WHERE r.status = 'active'
      ORDER BY r.created_at DESC
      LIMIT 100`
    );

    console.log(`[Admin Live] Found ${result.rows.length} active rooms`);

    return {
      rooms: result.rows.map((row) => ({
        id: row.id,
        channelName: row.channel_name,
        status: row.status,
        hostName: row.host_name || "Unknown",
        hostEmail: row.host_email,
        guestName: row.guest_name || "Waiting...",
        guestEmail: row.guest_email,
        createdAt: row.created_at,
      })),
    };
  } catch (error) {
    console.error("[Admin Live] Error:", error);
    throw new Error("Failed to fetch active rooms");
  }
});
