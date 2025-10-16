import { protectedProcedure } from '../../../create-context';

export const purchasesBalanceRoute = protectedProcedure.query(async ({ ctx }) => {
  const userId = ctx.user.id;

  const result = await ctx.db.query(
    `SELECT coins, ai_credits, premium_minutes, total_spent, total_earned, last_purchase_at
     FROM public.user_balances
     WHERE user_id = $1`,
    [userId]
  );

  if (result.rows.length === 0) {
    await ctx.db.query(
      'INSERT INTO public.user_balances (user_id, coins, ai_credits) VALUES ($1, 100, 10)',
      [userId]
    );
    return {
      coins: 100,
      ai_credits: 10,
      premium_minutes: 0,
      total_spent: 0,
      total_earned: 0,
      last_purchase_at: null,
    };
  }

  return result.rows[0];
});
