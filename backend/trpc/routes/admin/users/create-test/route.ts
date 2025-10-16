import { adminProcedure } from "@/backend/trpc/create-context";
import { z } from "zod";
import { pool } from "@/backend/lib/db";
import { supabaseServer } from "@/lib/supabaseServer";
import { generateUniqueUserId } from "@/backend/lib/idGenerator";

export const adminUsersCreateTestRoute = adminProcedure
  .input(
    z.object({
      email: z.string().email(),
      password: z.string().min(8),
      unlimited: z.boolean().default(true),
      name: z.string().optional(),
      verifyEmail: z.boolean().default(true),
    })
  )
  .mutation(async ({ input }: { input: { email: string; password: string; unlimited: boolean; name?: string; verifyEmail: boolean } }) => {
    console.log("[Admin] Create test user request:", input.email);

    try {
      const client = supabaseServer;

      // 1) Ensure auth user exists
      let userId: string | null = null;

      const existingUser = await pool.query(
        `SELECT id FROM auth.users WHERE email = $1 LIMIT 1`,
        [input.email]
      );

      if (existingUser.rows.length > 0) {
        userId = existingUser.rows[0].id as string;
        console.log("[Admin] Auth user already exists:", userId);
      } else {
        console.log("[Admin] Creating Supabase auth user...");
        const { data: created, error: createErr } = await client.auth.admin.createUser({
          email: input.email,
          password: input.password,
          email_confirm: input.verifyEmail,
          user_metadata: {
            name: input.name ?? "Test User",
            is_test_account: true,
          },
        });
        if (createErr || !created?.user) {
          console.error("[Admin] Failed to create auth user:", createErr);
          throw new Error("Failed to create auth user");
        }
        userId = created.user.id;
        console.log("[Admin] Auth user created:", userId);
      }

      if (!userId) {
        throw new Error("Auth user ID could not be resolved");
      }

      // 2) Ensure public.users row exists with a unique_id
      const checkUniqueExists = async (uid: string) => {
        const r = await pool.query(`SELECT 1 FROM public.users WHERE unique_id = $1`, [uid]);
        return r.rows.length > 0;
      };

      let uniqueId: string | null = null;

      const existingAppUser = await pool.query(
        `SELECT unique_id FROM public.users WHERE id = $1 LIMIT 1`,
        [userId]
      );

      if (existingAppUser.rows.length > 0) {
        uniqueId = existingAppUser.rows[0].unique_id as string;
        console.log("[Admin] public.users row exists:", uniqueId);
      } else {
        uniqueId = await generateUniqueUserId(checkUniqueExists);
        console.log("[Admin] Creating public.users with unique_id:", uniqueId);
        await pool.query(
          `INSERT INTO public.users (id, email, name, unique_id, is_test_account, unlimited_coins)
           VALUES ($1, $2, $3, $4, true, $5)
           ON CONFLICT (id) DO UPDATE SET 
             is_test_account = true,
             unlimited_coins = EXCLUDED.unlimited_coins`,
          [userId, input.email, input.name ?? "Test User", uniqueId, input.unlimited]
        );
      }

      // 3) Ensure profiles and wallets reflect unlimited coins for testing
      if (input.unlimited) {
        console.log("[Admin] Applying unlimited test balances...");
        await pool.query(
          `INSERT INTO public.profiles (id, coins, is_verified)
           VALUES ($1, 999999, true)
           ON CONFLICT (id) DO UPDATE SET coins = 999999, is_verified = true`,
          [userId]
        );

        await pool.query(
          `INSERT INTO public.wallets (user_id, balance)
           VALUES ($1, 999999)
           ON CONFLICT (user_id) DO UPDATE SET balance = 999999`,
          [userId]
        );

        // Optional: seed user_balances too if table exists
        try {
          await pool.query(
            `INSERT INTO public.user_balances (user_id, coins, ai_credits)
             VALUES ($1, 999999, 9999)
             ON CONFLICT (user_id) DO UPDATE SET coins = 999999, ai_credits = 9999`,
            [userId]
          );
        } catch (_e) {
          console.warn("[Admin] user_balances table not present or insert failed, skipping");
        }
      }

      // 4) Return payload
      return {
        success: true,
        userId,
        uniqueId,
        email: input.email,
        password: input.password,
        unlimited: input.unlimited,
        message: `Test user ready${input.unlimited ? ' with unlimited coins' : ''}`,
      };
    } catch (error) {
      console.error("[Admin] Create test user error:", error);
      throw new Error("Failed to create test user");
    }
  });
