import { protectedProcedure } from '../../../create-context';
import { z } from 'zod';

export const purchasesListRoute = protectedProcedure
  .input(
    z.object({
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    })
  )
  .query(async ({ ctx, input }) => {
    const { limit, offset } = input;
    const userId = ctx.user.id;

    const result = await ctx.db.query(
      `SELECT 
        id, type, amount, currency, coins, ai_credits,
        package_id, status, payment_method, created_at, completed_at
       FROM public.transactions
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    return {
      transactions: result.rows,
      hasMore: result.rows.length === limit,
    };
  });
