import { protectedProcedure } from '../../../create-context';
import { z } from 'zod';
import { confirmPayment } from '../../../../services/stripeService';

export const stripeConfirmPaymentRoute = protectedProcedure
  .input(
    z.object({
      paymentIntentId: z.string(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { paymentIntentId } = input;
    const userId = ctx.user.id;

    const paymentIntent = await confirmPayment(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      throw new Error('Payment not completed');
    }

    const transactionResult = await ctx.db.query(
      `SELECT * FROM public.transactions 
       WHERE metadata->>'paymentIntentId' = $1 AND user_id = $2`,
      [paymentIntentId, userId]
    );

    if (transactionResult.rows.length === 0) {
      throw new Error('Transaction not found');
    }

    const transaction = transactionResult.rows[0];

    if (transaction.status === 'completed') {
      return {
        success: true,
        message: 'Payment already processed',
        transaction,
      };
    }

    await ctx.db.query(
      `UPDATE public.transactions 
       SET status = 'completed', completed_at = NOW()
       WHERE id = $1`,
      [transaction.id]
    );

    await ctx.db.query(
      `UPDATE public.profiles 
       SET coins = COALESCE(coins, 0) + $1,
           ai_credits = COALESCE(ai_credits, 0) + $2
       WHERE id = $3`,
      [transaction.coins || 0, transaction.ai_credits || 0, userId]
    );

    const updatedProfile = await ctx.db.query(
      `SELECT coins, ai_credits FROM public.profiles WHERE id = $1`,
      [userId]
    );

    return {
      success: true,
      message: 'Payment confirmed and coins added',
      transaction,
      balance: updatedProfile.rows[0],
    };
  });
