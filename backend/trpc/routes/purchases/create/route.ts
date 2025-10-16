import { protectedProcedure } from '../../../create-context';
import { z } from 'zod';

export const purchasesCreateRoute = protectedProcedure
  .input(
    z.object({
      packageId: z.string(),
      currency: z.string().default('USD'),
      paymentMethod: z.enum(['google_play', 'apple_pay', 'stripe', 'paypal']),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { packageId, currency, paymentMethod } = input;
    const userId = ctx.user.id;

    const { IAP_PACKAGES } = await import('../../../../../constants/iapPackages.js');
    const pkg = IAP_PACKAGES.find(p => p.id === packageId);

    if (!pkg) {
      throw new Error('Package not found');
    }

    const totalCoins = pkg.coins;
    const orderId = `ORDER-${Date.now()}-${userId.substring(0, 8)}`;

    const result = await ctx.db.query(
      `INSERT INTO public.transactions (
        user_id, type, amount, currency, coins, ai_credits,
        package_id, product_id, status, payment_method, order_id, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        userId,
        'purchase',
        pkg.price,
        currency,
        totalCoins,
        pkg.aiCredits,
        pkg.id,
        pkg.id,
        'pending',
        paymentMethod,
        orderId,
        JSON.stringify({
          packageName: pkg.name,
          coins: pkg.coins,
          aiCredits: pkg.aiCredits,
          premiumMinutes: pkg.premiumMinutes,
        }),
      ]
    );

    return {
      success: true,
      transaction: result.rows[0],
      orderId,
    };
  });
