import { adminProcedure } from "@/backend/trpc/create-context";
import { pool } from "@/backend/lib/db";
import { z } from "zod";

const profileInputSchema = z.object({
  userId: z.string(),
});

export const adminUserGetProfileRoute = adminProcedure
  .input(profileInputSchema)
  .query(async ({ input }) => {
    const { userId } = input;
    try {
      const userRes = await pool.query(
        `SELECT id, email, raw_user_meta_data, created_at, last_sign_in_at FROM auth.users WHERE id = $1`,
        [userId]
      );
      const user = userRes.rows[0];
      if (!user) throw new Error("User not found");

      const profRes = await pool.query(
        `SELECT * FROM public.profiles WHERE id = $1`,
        [userId]
      ).catch(() => ({ rows: [] as any[] }));

      const p = profRes.rows[0] ?? {};
      const meta = (user.raw_user_meta_data ?? {}) as Record<string, any>;

      return {
        id: user.id as string,
        email: user.email as string,
        firstName: meta.firstName ?? meta.first_name ?? null,
        lastName: meta.lastName ?? meta.last_name ?? null,
        username: p.username ?? meta.username ?? null,
        displayName: p.display_name ?? meta.display_name ?? null,
        country: p.country ?? meta.country ?? null,
        city: p.city ?? meta.city ?? meta.hometown ?? null,
        gender: p.gender ?? meta.gender ?? null,
        orientation: p.gender_preference ?? meta.orientation ?? null,
        phoneCountry: meta.phoneCountry ?? meta.phone_country ?? null,
        phoneNumber: meta.phoneNumber ?? meta.phone_number ?? null,
        phoneE164: meta.phoneE164 ?? meta.phone_e164 ?? null,
      };
    } catch (e) {
      console.error('[adminUserGetProfileRoute] error', e);
      throw new Error('Failed to load user profile');
    }
  });

export const adminUserUpdateProfileRoute = adminProcedure
  .input(
    z.object({
      userId: z.string(),
      email: z.string().email().optional(),
      firstName: z.string().nullable().optional(),
      lastName: z.string().nullable().optional(),
      username: z.string().nullable().optional(),
      displayName: z.string().nullable().optional(),
      country: z.string().nullable().optional(),
      city: z.string().nullable().optional(),
      gender: z.string().nullable().optional(),
      orientation: z.string().nullable().optional(),
      phoneCountry: z.string().nullable().optional(),
      phoneNumber: z.string().nullable().optional(),
    })
  )
  .mutation(async ({ input }) => {
    const {
      userId,
      email,
      firstName,
      lastName,
      username,
      displayName,
      country,
      city,
      gender,
      orientation,
      phoneCountry,
      phoneNumber,
    } = input;

    const phoneE164 = phoneCountry && phoneNumber ? `${phoneCountry}${phoneNumber}` : null;

    try {
      // Update auth.users metadata and email if provided
      const currentUserRes = await pool.query(
        `SELECT raw_user_meta_data FROM auth.users WHERE id = $1`,
        [userId]
      );
      const currentMeta = (currentUserRes.rows[0]?.raw_user_meta_data ?? {}) as Record<string, any>;
      const newMeta = {
        ...currentMeta,
        firstName: firstName ?? null,
        lastName: lastName ?? null,
        username: username ?? currentMeta.username ?? null,
        display_name: displayName ?? currentMeta.display_name ?? null,
        country: country ?? currentMeta.country ?? null,
        city: city ?? currentMeta.city ?? null,
        hometown: city ?? currentMeta.hometown ?? null,
        gender: gender ?? currentMeta.gender ?? null,
        orientation: orientation ?? currentMeta.orientation ?? null,
        phoneCountry: phoneCountry ?? currentMeta.phoneCountry ?? null,
        phoneNumber: phoneNumber ?? currentMeta.phoneNumber ?? null,
        phoneE164: phoneE164 ?? currentMeta.phoneE164 ?? null,
      };

      await pool.query(
        `UPDATE auth.users SET raw_user_meta_data = $1::jsonb ${email ? ', email = $2' : ''} WHERE id = $${email ? 3 : 2}`,
        email ? [newMeta, email, userId] : [newMeta, userId]
      );

      // Try updating public.profiles where columns exist
      try {
        await pool.query(
          `UPDATE public.profiles 
           SET 
             username = COALESCE($1, username),
             display_name = COALESCE($2, display_name),
             country = COALESCE($3, country),
             city = COALESCE($4, city),
             gender = COALESCE($5, gender),
             gender_preference = COALESCE($6, gender_preference),
             updated_at = now()
           WHERE id = $7`,
          [username ?? null, displayName ?? null, country ?? null, city ?? null, gender ?? null, orientation ?? null, userId]
        );
      } catch (e) {
        console.warn('[adminUserUpdateProfileRoute] profiles update skipped', e);
      }

      return { success: true };
    } catch (e) {
      console.error('[adminUserUpdateProfileRoute] error', e);
      throw new Error('Failed to update user profile');
    }
  });
