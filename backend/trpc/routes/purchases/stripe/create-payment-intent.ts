import { protectedProcedure } from '../../../create-context';
import { z } from 'zod';
import { createPaymentIntent } from '../../../../services/stripeService';

export const stripeCreatePaymentIntentRoute = protectedProcedure
  .input(
    z.object({
      packageId: z.string(),
      currency: z.string().default('USD'),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { packageId, currency } = input;
    const userId = ctx.user.id;

    const { IAP_PACKAGES } = await import('../../../../../constants/iapPackages.js');
    const pkg = IAP_PACKAGES.find(p => p.id === packageId);

    if (!pkg) {
      throw new Error('Package not found');
    }

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
        pkg.coins,
        pkg.aiCredits,
        pkg.id,
        pkg.id,
        'pending',
        'stripe',
        orderId,
        JSON.stringify({
          packageName: pkg.name,
          coins: pkg.coins,
          aiCredits: pkg.aiCredits,
          premiumMinutes: pkg.premiumMinutes,
        }),
      ]
    );

    const transaction = result.rows[0];

    const paymentIntent = await createPaymentIntent({
      amount: pkg.price,
      currency,
      userId,
      packageId: pkg.id,
      metadata: {
        transactionId: transaction.id,
        orderId,
        coins: pkg.coins.toString(),
      },
    });

    await ctx.db.query(
      `UPDATE public.transactions 
       SET metadata = jsonb_set(metadata::jsonb, '{paymentIntentId}', $1::jsonb)
       WHERE id = $2`,
      [JSON.stringify(paymentIntent.paymentIntentId), transaction.id]
    );

    return {
      success: true,
      clientSecret: paymentIntent.clientSecret,
      paymentIntentId: paymentIntent.paymentIntentId,
      transaction,
      orderId,
    };
  });
