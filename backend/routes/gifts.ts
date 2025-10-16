import { Hono } from 'hono';
import type { Context } from 'hono';
import { auth } from '../middlewares/auth.js';
import { q } from '../lib/db.js';
import { audit } from '../lib/audit.js';

const r = new Hono();

r.get('/catalog', async (c: Context) => {
  try {
    const category = c.req.query('category');
    
    const gifts = await q(
      `SELECT id, name, description, coin_price, thumbnail_url, animation_url, category
       FROM gifts
       WHERE is_active = true
         ${category ? 'AND category = $1' : ''}
       ORDER BY coin_price ASC`,
      category ? [category] : []
    );

    return c.json({ success: true, gifts: gifts.rows });
  } catch (error) {
    console.error('Get gifts error:', error);
    return c.json({ success: false, message: 'Failed to fetch gifts' }, 500);
  }
});

r.post('/send', auth(), async (c: Context) => {
  try {
    const userId = (c.get('auth') as any).userId;
    const { giftId, toUserId, roomId, messageId } = await c.req.json();

    if (!giftId || (!toUserId && !roomId)) {
      return c.json({ success: false, message: 'Gift ID and recipient required' }, 400);
    }

    const giftResult = await q(
      `SELECT coin_price, is_active FROM gifts WHERE id = $1`,
      [giftId]
    );

    if (giftResult.rows.length === 0 || !giftResult.rows[0].is_active) {
      return c.json({ success: false, message: 'Gift not found or inactive' }, 404);
    }

    const coinPrice = giftResult.rows[0].coin_price;

    const balanceResult = await q(
      `SELECT coins_balance FROM user_settings WHERE user_id = $1`,
      [userId]
    );

    const currentBalance = balanceResult.rows[0]?.coins_balance || 0;

    if (currentBalance < coinPrice) {
      return c.json({ success: false, message: 'Insufficient coins' }, 400);
    }

    const newBalance = currentBalance - coinPrice;

    await q(
      `UPDATE user_settings SET coins_balance = $1 WHERE user_id = $2`,
      [newBalance, userId]
    );

    await q(
      `INSERT INTO coin_ledger (user_id, delta, reason, ref_type, ref_id, balance_after)
       VALUES ($1, $2, 'gift_sent', 'gift', $3, $4)`,
      [userId, -coinPrice, giftId, newBalance]
    );

    const eventResult = await q(
      `INSERT INTO gift_events (gift_id, from_user_id, to_user_id, room_id, coins_spent, message_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, created_at`,
      [giftId, userId, toUserId, roomId, coinPrice, messageId]
    );

    await audit(
      userId,
      'send_gift',
      'gift_event',
      eventResult.rows[0].id,
      { giftId, toUserId, roomId, coinPrice },
      c.req.header('x-forwarded-for'),
      c.req.header('user-agent')
    );

    return c.json({ 
      success: true, 
      eventId: eventResult.rows[0].id,
      newBalance
    });
  } catch (error) {
    console.error('Send gift error:', error);
    return c.json({ success: false, message: 'Failed to send gift' }, 500);
  }
});

r.get('/packages', async (c: Context) => {
  try {
    const packages = await q(
      `SELECT id, name, coins, bonus_coins, price_cents, currency
       FROM coin_packages
       WHERE is_active = true
       ORDER BY price_cents ASC`
    );

    return c.json({ success: true, packages: packages.rows });
  } catch (error) {
    console.error('Get packages error:', error);
    return c.json({ success: false, message: 'Failed to fetch packages' }, 500);
  }
});

r.post('/purchase', auth(), async (c: Context) => {
  try {
    const userId = (c.get('auth') as any).userId;
    const { packageId, receiptId } = await c.req.json();

    if (!packageId || !receiptId) {
      return c.json({ success: false, message: 'Package ID and receipt ID required' }, 400);
    }

    const existingPurchase = await q(
      `SELECT id FROM purchases WHERE receipt_id = $1`,
      [receiptId]
    );

    if (existingPurchase.rows.length > 0) {
      return c.json({ success: false, message: 'Receipt already processed' }, 400);
    }

    const packageResult = await q(
      `SELECT coins, bonus_coins, price_cents, currency FROM coin_packages WHERE id = $1 AND is_active = true`,
      [packageId]
    );

    if (packageResult.rows.length === 0) {
      return c.json({ success: false, message: 'Package not found' }, 404);
    }

    const pkg = packageResult.rows[0];
    const totalCoins = pkg.coins + pkg.bonus_coins;

    const purchaseResult = await q(
      `INSERT INTO purchases (user_id, package_id, amount_cents, currency, receipt_id, status)
       VALUES ($1, $2, $3, $4, $5, 'completed')
       RETURNING id`,
      [userId, packageId, pkg.price_cents, pkg.currency, receiptId]
    );

    const balanceResult = await q(
      `SELECT coins_balance FROM user_settings WHERE user_id = $1`,
      [userId]
    );

    const currentBalance = balanceResult.rows[0]?.coins_balance || 0;
    const newBalance = currentBalance + totalCoins;

    await q(
      `INSERT INTO user_settings (user_id, coins_balance)
       VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE SET coins_balance = $2`,
      [userId, newBalance]
    );

    await q(
      `INSERT INTO coin_ledger (user_id, delta, reason, ref_type, ref_id, balance_after)
       VALUES ($1, $2, 'purchase', 'purchase', $3, $4)`,
      [userId, totalCoins, purchaseResult.rows[0].id, newBalance]
    );

    await audit(
      userId,
      'purchase_coins',
      'purchase',
      purchaseResult.rows[0].id,
      { packageId, totalCoins, price: pkg.price_cents },
      c.req.header('x-forwarded-for'),
      c.req.header('user-agent')
    );

    return c.json({ 
      success: true, 
      purchaseId: purchaseResult.rows[0].id,
      coinsAdded: totalCoins,
      newBalance
    });
  } catch (error) {
    console.error('Purchase error:', error);
    return c.json({ success: false, message: 'Purchase failed' }, 500);
  }
});

r.get('/balance', auth(), async (c: Context) => {
  try {
    const userId = (c.get('auth') as any).userId;

    const result = await q(
      `SELECT coins_balance FROM user_settings WHERE user_id = $1`,
      [userId]
    );

    const balance = result.rows[0]?.coins_balance || 0;

    return c.json({ success: true, balance });
  } catch (error) {
    console.error('Get balance error:', error);
    return c.json({ success: false, message: 'Failed to fetch balance' }, 500);
  }
});

r.get('/transactions', auth(), async (c: Context) => {
  try {
    const userId = (c.get('auth') as any).userId;
    const limit = Number(c.req.query('limit') || 50);

    const transactions = await q(
      `SELECT id, delta, reason, ref_type, balance_after, created_at
       FROM coin_ledger
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit]
    );

    return c.json({ success: true, transactions: transactions.rows });
  } catch (error) {
    console.error('Get transactions error:', error);
    return c.json({ success: false, message: 'Failed to fetch transactions' }, 500);
  }
});

export default r;
