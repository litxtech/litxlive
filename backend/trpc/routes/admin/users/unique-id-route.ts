import { adminProcedure } from "../../../create-context";
import { pool } from "@/backend/lib/db";
import { z } from "zod";

// Search users for autocomplete
export const adminUserSearchUsersRoute = adminProcedure
  .input(z.object({ 
    query: z.string().min(2),
    limit: z.number().min(1).max(50).default(10)
  }))
  .query(async ({ input }) => {
    console.log("[Admin] Searching users:", input.query);

    try {
      const result = await pool.query(
        `SELECT 
          id, 
          unique_id, 
          email, 
          name,
          status,
          created_at
        FROM users 
        WHERE 
          LOWER(email) LIKE LOWER($1) OR 
          LOWER(name) LIKE LOWER($1) OR 
          LOWER(unique_id) LIKE LOWER($1)
        ORDER BY 
          CASE 
            WHEN LOWER(email) = LOWER($1) THEN 1
            WHEN LOWER(name) = LOWER($1) THEN 2
            WHEN LOWER(unique_id) = LOWER($1) THEN 3
            WHEN LOWER(email) LIKE LOWER($1 || '%') THEN 4
            WHEN LOWER(name) LIKE LOWER($1 || '%') THEN 5
            WHEN LOWER(unique_id) LIKE LOWER($1 || '%') THEN 6
            ELSE 7
          END,
          created_at DESC
        LIMIT $2`,
        [`%${input.query}%`, input.limit]
      );

      return result.rows.map(row => ({
        id: row.id,
        uniqueId: row.unique_id,
        email: row.email,
        name: row.name,
        status: row.status,
        createdAt: row.created_at,
      }));
    } catch (error) {
      console.error("[Admin] Search users error:", error);
      throw new Error("Failed to search users");
    }
  });

export const adminUserSearchByUniqueIdRoute = adminProcedure
  .input(z.object({ uniqueId: z.string() }))
  .query(async ({ input }) => {
    console.log("[Admin] Searching user by unique ID:", input.uniqueId);

    try {
      const result = await pool.query(
        `SELECT * FROM get_user_by_unique_id($1)`,
        [input.uniqueId]
      );

      if (result.rows.length === 0) {
        throw new Error("User not found");
      }

      const user = result.rows[0];

      const analyticsResult = await pool.query(
        `SELECT * FROM public.user_analytics WHERE unique_id = $1`,
        [input.uniqueId]
      );

      const analytics = analyticsResult.rows[0] || {};

      return {
        user: {
          id: user.id,
          uniqueId: user.unique_id,
          email: user.email,
          name: user.name,
          coins: user.coins,
          status: user.status,
          isTestAccount: user.is_test_account,
          unlimitedCoins: user.unlimited_coins,
          createdAt: user.created_at,
        },
        analytics: {
          totalCalls: analytics.total_calls || 0,
          totalMinutes: analytics.total_minutes || 0,
          coinsSpent: analytics.coins_spent || 0,
          coinsEarned: analytics.coins_earned || 0,
          giftsSent: analytics.gifts_sent || 0,
          giftsReceived: analytics.gifts_received || 0,
          messagesSent: analytics.messages_sent || 0,
          lastActive: analytics.last_active,
        },
      };
    } catch (error) {
      console.error("[Admin] Search by unique ID error:", error);
      throw new Error("Failed to search user by unique ID");
    }
  });

export const adminUserAddCoinsByUniqueIdRoute = adminProcedure
  .input(
    z.object({
      uniqueId: z.string(),
      amount: z.number().int().positive(),
      reason: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    console.log("[Admin] Adding coins by unique ID:", input);

    try {
      const result = await pool.query(
        `SELECT * FROM add_coins_by_unique_id($1, $2, $3)`,
        [input.uniqueId, input.amount, input.reason || "Admin grant"]
      );

      const response = result.rows[0];

      if (!response.success) {
        throw new Error(response.message);
      }

      console.log("[Admin] Coins added successfully:", response);

      return {
        success: true,
        newBalance: response.new_balance,
        message: response.message,
      };
    } catch (error) {
      console.error("[Admin] Add coins error:", error);
      throw new Error("Failed to add coins");
    }
  });

export const adminUserBanByUniqueIdRoute = adminProcedure
  .input(
    z.object({
      uniqueId: z.string(),
      reason: z.string(),
      durationDays: z.number().int().positive().optional(),
    })
  )
  .mutation(async ({ input }) => {
    console.log("[Admin] Banning user by unique ID:", input);

    try {
      const result = await pool.query(
        `SELECT * FROM ban_user_by_unique_id($1, $2, $3)`,
        [input.uniqueId, input.reason, input.durationDays || null]
      );

      const response = result.rows[0];

      if (!response.success) {
        throw new Error(response.message);
      }

      console.log("[Admin] User banned successfully");

      return {
        success: true,
        message: response.message,
      };
    } catch (error) {
      console.error("[Admin] Ban user error:", error);
      throw new Error("Failed to ban user");
    }
  });

export const adminUserSetUnlimitedCoinsRoute = adminProcedure
  .input(
    z.object({
      uniqueId: z.string(),
      unlimited: z.boolean(),
    })
  )
  .mutation(async ({ input }) => {
    console.log("[Admin] Setting unlimited coins:", input);

    try {
      await pool.query(
        `UPDATE public.users SET unlimited_coins = $1 WHERE unique_id = $2`,
        [input.unlimited, input.uniqueId]
      );

      if (input.unlimited) {
        await pool.query(
          `UPDATE public.profiles SET coins = 999999 WHERE id = (
            SELECT id FROM public.users WHERE unique_id = $1
          )`,
          [input.uniqueId]
        );

        await pool.query(
          `UPDATE public.wallets SET balance = 999999 WHERE user_id = (
            SELECT id FROM public.users WHERE unique_id = $1
          )`,
          [input.uniqueId]
        );
      }

      console.log("[Admin] Unlimited coins set successfully");

      return { success: true };
    } catch (error) {
      console.error("[Admin] Set unlimited coins error:", error);
      throw new Error("Failed to set unlimited coins");
    }
  });

export const adminUserVerifyByUniqueIdRoute = adminProcedure
  .input(
    z.object({
      uniqueId: z.string(),
      verificationType: z.enum(["identity", "phone", "email", "agency"]),
      badgeLevel: z.enum(["basic", "silver", "gold", "platinum"]).optional(),
    })
  )
  .mutation(async ({ input }) => {
    console.log("[Admin] Verifying user by unique ID:", input);

    try {
      const userResult = await pool.query(
        `SELECT id FROM public.users WHERE unique_id = $1`,
        [input.uniqueId]
      );

      if (userResult.rows.length === 0) {
        throw new Error("User not found");
      }

      const userId = userResult.rows[0].id;

      await pool.query(
        `INSERT INTO public.user_verifications (unique_id, is_verified, verification_type, verified_at, badge_level)
         VALUES ($1, true, $2, NOW(), $3)
         ON CONFLICT (unique_id) DO UPDATE SET
           is_verified = true,
           verification_type = $2,
           verified_at = NOW(),
           badge_level = $3`,
        [input.uniqueId, input.verificationType, input.badgeLevel || "basic"]
      );

      await pool.query(
        `UPDATE public.profiles SET is_verified = true WHERE id = $1`,
        [userId]
      );

      console.log("[Admin] User verified successfully");

      return { success: true };
    } catch (error) {
      console.error("[Admin] Verify user error:", error);
      throw new Error("Failed to verify user");
    }
  });

export const adminUserGenerateReferralCodeRoute = adminProcedure
  .input(z.object({ uniqueId: z.string() }))
  .mutation(async ({ input }) => {
    console.log("[Admin] Generating referral code:", input.uniqueId);

    try {
      const result = await pool.query(
        `SELECT generate_referral_code($1) as code`,
        [input.uniqueId]
      );

      const referralCode = result.rows[0].code;

      console.log("[Admin] Referral code generated:", referralCode);

      return {
        success: true,
        referralCode,
      };
    } catch (error) {
      console.error("[Admin] Generate referral code error:", error);
      throw new Error("Failed to generate referral code");
    }
  });

export const adminUserGetAnalyticsRoute = adminProcedure
  .input(z.object({ uniqueId: z.string() }))
  .query(async ({ input }) => {
    console.log("[Admin] Getting user analytics:", input.uniqueId);

    try {
      const analyticsResult = await pool.query(
        `SELECT * FROM public.user_analytics WHERE unique_id = $1`,
        [input.uniqueId]
      );

      const analytics = analyticsResult.rows[0];

      if (!analytics) {
        return {
          totalCalls: 0,
          totalMinutes: 0,
          coinsSpent: 0,
          coinsEarned: 0,
          giftsSent: 0,
          giftsReceived: 0,
          messagesSent: 0,
          lastActive: null,
        };
      }

      const coinHistoryResult = await pool.query(
        `SELECT delta, reason, balance_after, created_at
         FROM public.coin_ledger
         WHERE user_id = (SELECT id FROM public.users WHERE unique_id = $1)
         ORDER BY created_at DESC
         LIMIT 50`,
        [input.uniqueId]
      );

      return {
        totalCalls: analytics.total_calls,
        totalMinutes: analytics.total_minutes,
        coinsSpent: analytics.coins_spent,
        coinsEarned: analytics.coins_earned,
        giftsSent: analytics.gifts_sent,
        giftsReceived: analytics.gifts_received,
        messagesSent: analytics.messages_sent,
        lastActive: analytics.last_active,
        coinHistory: coinHistoryResult.rows.map((row) => ({
          delta: row.delta,
          reason: row.reason,
          balanceAfter: row.balance_after,
          createdAt: row.created_at,
        })),
      };
    } catch (error) {
      console.error("[Admin] Get analytics error:", error);
      throw new Error("Failed to get user analytics");
    }
  });

export const adminUserBulkAddCoinsRoute = adminProcedure
  .input(
    z.object({
      uniqueIds: z.array(z.string()),
      amount: z.number().int().positive(),
      reason: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    console.log("[Admin] Bulk adding coins:", input);

    try {
      const results = [];

      for (const uniqueId of input.uniqueIds) {
        try {
          const result = await pool.query(
            `SELECT * FROM add_coins_by_unique_id($1, $2, $3)`,
            [uniqueId, input.amount, input.reason || "Bulk admin grant"]
          );

          results.push({
            uniqueId,
            success: result.rows[0].success,
            message: result.rows[0].message,
          });
        } catch (error) {
          results.push({
            uniqueId,
            success: false,
            message: "Failed to add coins",
          });
        }
      }

      const successCount = results.filter((r) => r.success).length;

      console.log(
        `[Admin] Bulk coins added: ${successCount}/${input.uniqueIds.length}`
      );

      return {
        success: true,
        results,
        successCount,
        totalCount: input.uniqueIds.length,
      };
    } catch (error) {
      console.error("[Admin] Bulk add coins error:", error);
      throw new Error("Failed to bulk add coins");
    }
  });

export const adminUserGetTopUsersRoute = adminProcedure
  .input(
    z.object({
      limit: z.number().int().positive().default(50),
      sortBy: z
        .enum(["calls", "minutes", "coins_spent", "gifts_sent"])
        .default("calls"),
    })
  )
  .query(async ({ input }) => {
    console.log("[Admin] Getting top users:", input);

    try {
      const sortColumn = {
        calls: "total_calls",
        minutes: "total_minutes",
        coins_spent: "coins_spent",
        gifts_sent: "gifts_sent",
      }[input.sortBy];

      const result = await pool.query(
        `SELECT 
          u.unique_id,
          u.name,
          u.email,
          ua.total_calls,
          ua.total_minutes,
          ua.coins_spent,
          ua.gifts_sent,
          p.coins as current_coins,
          ua.last_active
         FROM public.users u
         LEFT JOIN public.user_analytics ua ON ua.unique_id = u.unique_id
         LEFT JOIN public.profiles p ON p.id = u.id
         WHERE u.is_test_account = false
         ORDER BY ua.${sortColumn} DESC NULLS LAST
         LIMIT $1`,
        [input.limit]
      );

      return {
        users: result.rows.map((row) => ({
          uniqueId: row.unique_id,
          name: row.name,
          email: row.email,
          totalCalls: row.total_calls || 0,
          totalMinutes: row.total_minutes || 0,
          coinsSpent: row.coins_spent || 0,
          giftsSent: row.gifts_sent || 0,
          currentCoins: row.current_coins || 0,
          lastActive: row.last_active,
        })),
      };
    } catch (err) {
      console.error("[Admin] Get top users error:", err);
      throw new Error("Failed to get top users");
    }
  });
