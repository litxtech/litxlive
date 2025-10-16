import { z } from 'zod';
import { adminProcedure } from '../../../create-context';

export const adminEconomyUpdateSettingRoute = adminProcedure
  .input(z.object({
    key: z.string(),
    value: z.string(),
  }))
  .mutation(async ({ ctx, input }) => {
    const { db, admin } = ctx;

    if (!admin) {
      throw new Error('Unauthorized: Admin access required');
    }

    let jsonValue: any;
    try {
      jsonValue = JSON.parse(input.value);
    } catch {
      jsonValue = input.value;
    }

    await db.query(`
      UPDATE public.coin_economy
      SET 
        setting_value = $1,
        updated_at = now(),
        updated_by = $2
      WHERE setting_key = $3
    `, [JSON.stringify(jsonValue), admin.id, input.key]);

    await db.query(`
      INSERT INTO public.admin_activity_logs (admin_user_id, action, resource_type, details)
      VALUES ($1, 'update_economy_setting', 'coin_economy', $2)
    `, [admin.id, JSON.stringify({ key: input.key, value: jsonValue })]);

    return { success: true, message: 'Setting updated successfully' };
  });
