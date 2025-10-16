import { adminProcedure } from "../../../create-context";
import { pool } from "@/backend/lib/db";
import { z } from "zod";

export const adminUsersListRoute = adminProcedure
  .input(
    z.object({
      search: z.string().optional(),
      limit: z.number().default(50),
      offset: z.number().default(0),
    })
  )
  .query(async ({ input }) => {
    console.log("[Admin Users] Fetching users:", input);

    try {
      const searchCondition = input.search
        ? `WHERE u.email ILIKE $1 OR u.raw_user_meta_data->>'full_name' ILIKE $1 OR u.id::text ILIKE $1`
        : "";

      const searchParam = input.search ? `%${input.search}%` : null;

      const query = `
        SELECT 
          u.id,
          u.email,
          u.raw_user_meta_data->>'full_name' as name,
          u.raw_user_meta_data->>'country' as country,
          u.email_confirmed_at,
          u.created_at,
          u.last_sign_in_at,
          u.banned_until,
          p.coins,
          p.is_verified,
          p.kyc_status,
          (SELECT COUNT(*) FROM public.reports WHERE reported_user_id = u.id) as report_count
        FROM auth.users u
        LEFT JOIN public.profiles p ON p.id = u.id
        ${searchCondition}
        ORDER BY u.created_at DESC
        LIMIT $${searchParam ? 2 : 1} OFFSET $${searchParam ? 3 : 2}
      `;

      const params = searchParam
        ? [searchParam, input.limit, input.offset]
        : [input.limit, input.offset];

      const result = await pool.query(query, params);

      const countQuery = `
        SELECT COUNT(*) as total
        FROM auth.users u
        ${searchCondition}
      `;

      const countParams = searchParam ? [searchParam] : [];
      const countResult = await pool.query(countQuery, countParams);

      console.log(`[Admin Users] Found ${result.rows.length} users`);

      return {
        users: result.rows.map((row) => ({
          id: row.id,
          name: row.name || "Unknown",
          email: row.email,
          country: row.country || "Unknown",
          emailVerified: !!row.email_confirmed_at,
          verified: row.is_verified || false,
          kycStatus: row.kyc_status || "pending",
          coins: row.coins || 0,
          createdAt: row.created_at,
          lastSignIn: row.last_sign_in_at,
          banned: !!row.banned_until,
          reportCount: parseInt(row.report_count || "0"),
          accountAge: Math.floor(
            (Date.now() - new Date(row.created_at).getTime()) /
              (1000 * 60 * 60 * 24)
          ),
        })),
        total: parseInt(countResult.rows[0]?.total || "0"),
      };
    } catch (error) {
      console.error("[Admin Users] Error:", error);
      throw new Error("Failed to fetch users");
    }
  });

export const adminUserBanRoute = adminProcedure
  .input(
    z.object({
      userId: z.string(),
      reason: z.string(),
      durationDays: z.number().optional(),
    })
  )
  .mutation(async ({ input }) => {
    console.log("[Admin Users] Banning user:", input);

    try {
      const banUntil = input.durationDays
        ? new Date(Date.now() + input.durationDays * 24 * 60 * 60 * 1000)
        : null;

      await pool.query(
        `UPDATE auth.users SET banned_until = $1 WHERE id = $2`,
        [banUntil, input.userId]
      );

      await pool.query(
        `INSERT INTO public.moderation_actions (user_id, action_type, reason, performed_by, expires_at)
         VALUES ($1, 'ban', $2, 'admin', $3)`,
        [input.userId, input.reason, banUntil]
      );

      console.log("[Admin Users] User banned successfully");

      return { success: true };
    } catch (error) {
      console.error("[Admin Users] Ban error:", error);
      throw new Error("Failed to ban user");
    }
  });

export const adminUserUnbanRoute = adminProcedure
  .input(z.object({ userId: z.string() }))
  .mutation(async ({ input }) => {
    console.log("[Admin Users] Unbanning user:", input.userId);

    try {
      await pool.query(`UPDATE auth.users SET banned_until = NULL WHERE id = $1`, [
        input.userId,
      ]);

      console.log("[Admin Users] User unbanned successfully");

      return { success: true };
    } catch (error) {
      console.error("[Admin Users] Unban error:", error);
      throw new Error("Failed to unban user");
    }
  });

export const adminUserVerifyRoute = adminProcedure
  .input(z.object({ userId: z.string() }))
  .mutation(async ({ input }) => {
    console.log("[Admin Users] Verifying user:", input.userId);

    try {
      await pool.query(
        `UPDATE public.profiles SET is_verified = true WHERE id = $1`,
        [input.userId]
      );

      console.log("[Admin Users] User verified successfully");

      return { success: true };
    } catch (error) {
      console.error("[Admin Users] Verify error:", error);
      throw new Error("Failed to verify user");
    }
  });
