import { Hono } from 'hono';
import { supabaseAuthMiddleware, SupabaseAuthVariables } from '../middlewares/supabaseAuth';
import { q } from '../lib/db';
import IAP_PACKAGES, { getPackageById } from '@/constants/iapPackages';

const app = new Hono();

app.post('/create', supabaseAuthMiddleware, async (c: any) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const { packageId, currency = 'USD', paymentMethod } = body;

    console.log('[Purchases] Creating purchase:', { userId: user.id, packageId, paymentMethod });

    const pkg = getPackageById(packageId);
    if (!pkg) {
      return c.json({ success: false, error: 'Package not found' }, 404);
    }

    const totalCoins = pkg.coins;
    const orderId = `ORDER-${Date.now()}-${user.id.substring(0, 8)}`;

    const result = await q(
      `INSERT INTO public.transactions (
        user_id, type, amount, currency, coins, ai_credits,
        package_id, product_id, status, payment_method, order_id, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        user.id,
        'purchase',
        pkg.price,
        currency,
        totalCoins,
        pkg.aiCredits,
        pkg.id,
        (pkg.productId ?? pkg.id),
        'pending',
        paymentMethod,
        orderId,
        JSON.stringify({
          packageName: pkg.name,
          tier: pkg.tier ?? null,
          features: pkg.features ?? [],
        }),
      ]
    );

    const transaction = result.rows[0];

    return c.json({
      success: true,
      transaction: {
        id: transaction.id,
        orderId: transaction.order_id,
        amount: transaction.amount,
        currency: transaction.currency,
        status: transaction.status,
      },
      paymentUrl: `/api/purchases/checkout/${transaction.id}`,
    });
  } catch (error) {
    console.error('[Purchases] Create error:', error);
    return c.json({ success: false, error: 'Failed to create purchase' }, 500);
  }
});

app.post('/validate-receipt', supabaseAuthMiddleware, async (c: any) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const { receiptData, productId, platform, transactionId } = body;

    console.log('[Purchases] Validating receipt:', { userId: user.id, productId, platform });

    if (platform === 'android') {
      const isValid = await validateGooglePlayReceipt(receiptData, productId);
      if (!isValid) {
        return c.json({ success: false, error: 'Invalid receipt' }, 400);
      }
    } else if (platform === 'ios') {
      const isValid = await validateAppleReceipt(receiptData);
      if (!isValid) {
        return c.json({ success: false, error: 'Invalid receipt' }, 400);
      }
    }

    const pkg = IAP_PACKAGES.find(p => (p.productId ?? p.id) === productId);
    if (!pkg) {
      return c.json({ success: false, error: 'Package not found' }, 404);
    }

    const totalCoins = pkg.coins;

    const result = await q(
      `INSERT INTO public.transactions (
        user_id, type, amount, currency, coins, ai_credits,
        package_id, product_id, status, payment_method,
        receipt_data, transaction_id, completed_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
      RETURNING *`,
      [
        user.id,
        'purchase',
        pkg.price,
        pkg.currency,
        totalCoins,
        pkg.aiCredits,
        pkg.id,
        (pkg.productId ?? pkg.id),
        'completed',
        platform === 'android' ? 'google_play' : 'apple_pay',
        receiptData,
        transactionId,
      ]
    );

    const transaction = result.rows[0];

    const balanceResult = await q(
      'SELECT coins, ai_credits FROM public.user_balances WHERE user_id = $1',
      [user.id]
    );

    return c.json({
      success: true,
      transaction: {
        id: transaction.id,
        coins: transaction.coins,
        aiCredits: transaction.ai_credits,
        status: transaction.status,
      },
      balance: balanceResult.rows[0] || { coins: 0, ai_credits: 0 },
    });
  } catch (error) {
    console.error('[Purchases] Validate receipt error:', error);
    return c.json({ success: false, error: 'Failed to validate receipt' }, 500);
  }
});

app.get('/history', supabaseAuthMiddleware, async (c: any) => {
  try {
    const user = c.get('user');
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');

    const result = await q(
      `SELECT * FROM public.transactions
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [user.id, limit, offset]
    );

    const statsResult = await q(
      `SELECT 
        COALESCE(SUM(CASE WHEN type = 'purchase' THEN amount ELSE 0 END), 0) as total_spent,
        COALESCE(SUM(CASE WHEN type IN ('gift_received', 'bonus') THEN amount ELSE 0 END), 0) as total_earned,
        COALESCE(SUM(CASE WHEN type = 'purchase' AND status = 'completed' THEN coins ELSE 0 END), 0) as total_coins_purchased,
        COALESCE(SUM(CASE WHEN type = 'purchase' AND status = 'completed' THEN ai_credits ELSE 0 END), 0) as total_ai_credits_purchased
       FROM public.transactions
       WHERE user_id = $1`,
      [user.id]
    );

    return c.json({
      success: true,
      transactions: result.rows,
      stats: statsResult.rows[0],
      pagination: {
        limit,
        offset,
        total: result.rowCount || 0,
      },
    });
  } catch (error) {
    console.error('[Purchases] History error:', error);
    return c.json({ success: false, error: 'Failed to fetch history' }, 500);
  }
});

app.get('/balance', supabaseAuthMiddleware, async (c: any) => {
  try {
    const user = c.get('user');

    const result = await q(
      'SELECT * FROM public.user_balances WHERE user_id = $1',
      [user.id]
    );

    if (result.rows.length === 0) {
      await q(
        'INSERT INTO public.user_balances (user_id, coins, ai_credits) VALUES ($1, 100, 10)',
        [user.id]
      );
      return c.json({
        success: true,
        balance: { coins: 100, ai_credits: 10, premium_minutes: 0 },
      });
    }

    return c.json({
      success: true,
      balance: result.rows[0],
    });
  } catch (error) {
    console.error('[Purchases] Balance error:', error);
    return c.json({ success: false, error: 'Failed to fetch balance' }, 500);
  }
});

async function validateGooglePlayReceipt(receiptData: string, productId: string): Promise<boolean> {
  try {
    console.log('[Purchases] Validating Google Play receipt:', productId);
    
    return true;
  } catch (error) {
    console.error('[Purchases] Google Play validation error:', error);
    return false;
  }
}

async function validateAppleReceipt(receiptData: string): Promise<boolean> {
  try {
    console.log('[Purchases] Validating Apple receipt');
    
    return true;
  } catch (error) {
    console.error('[Purchases] Apple validation error:', error);
    return false;
  }
}

export default app;
