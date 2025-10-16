import { protectedProcedure } from '../../../create-context';
import { z } from 'zod';

export const purchasesValidateRoute = protectedProcedure
  .input(
    z.object({
      receiptData: z.string(),
      productId: z.string(),
      platform: z.enum(['android', 'ios']),
      transactionId: z.string(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { receiptData, productId, platform, transactionId } = input;
    const userId = ctx.user.id;

    console.log('[tRPC] Validating receipt:', { userId, productId, platform });

    const { IAP_PACKAGES } = await import('../../../../../constants/iapPackages.js');
    const pkg = IAP_PACKAGES.find(p => p.id === productId);

    if (!pkg) {
      throw new Error('Package not found');
    }

    const totalCoins = pkg.coins;

    const result = await ctx.db.query(
      `INSERT INTO public.transactions (
        user_id, type, amount, currency, coins, ai_credits,
        package_id, product_id, status, payment_method,
        receipt_data, transaction_id, completed_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
      RETURNING *`,
      [
        userId,
        'purchase',
        pkg.price,
        pkg.currency,
        totalCoins,
        pkg.aiCredits,
        pkg.id,
        pkg.id,
        'completed',
        platform === 'android' ? 'google_play' : 'apple_pay',
        receiptData,
        transactionId,
      ]
    );

    const balanceResult = await ctx.db.query(
      'SELECT coins, ai_credits FROM public.user_balances WHERE user_id = $1',
      [userId]
    );

    return {
      success: true,
      transaction: result.rows[0],
      balance: balanceResult.rows[0],
    };
  });
