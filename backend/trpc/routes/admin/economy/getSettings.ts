import { protectedProcedure } from '../../../create-context';

export const adminEconomyGetSettingsRoute = protectedProcedure
  .query(async ({ ctx }) => {
    const { db } = ctx;

    const result = await db.query(`
      SELECT setting_key, setting_value, description, category
      FROM public.coin_economy
      WHERE is_active = true
      ORDER BY category, setting_key
    `);

    const settings: Record<string, any> = {};
    
    for (const row of result.rows) {
      const key = row.setting_key;
      let value = row.setting_value;

      if (typeof value === 'string') {
        try {
          value = JSON.parse(value);
        } catch {
          value = value;
        }
      }

      settings[key] = value;
    }

    return settings;
  });
