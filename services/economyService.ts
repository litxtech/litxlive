import { supabase } from '@/lib/supabase';

export interface EconomySettings {
  call_connect_cost: number;
  call_per_minute_cost: number;
  daily_purchase_limit: number;
  daily_spend_limit: number;
  gift_rate_limit_per_minute: number;
  gift_rate_limit_per_hour: number;
  coin_packages: Record<string, {
    coins: number;
    bonus: number;
    price_usd: number;
    tier: string;
  }>;
  gifts: Record<string, {
    name: string;
    coins: number;
    icon: string;
  }>;
}

let cachedSettings: EconomySettings | null = null;
let lastFetch = 0;
const CACHE_DURATION = 60000;

export async function getEconomySettings(): Promise<EconomySettings> {
  const now = Date.now();
  
  if (cachedSettings && (now - lastFetch) < CACHE_DURATION) {
    return cachedSettings;
  }

  const { data, error } = await supabase
    .from('coin_economy')
    .select('setting_key, setting_value')
    .eq('is_active', true);

  if (error) {
    console.error('Failed to fetch economy settings:', error);
    throw error;
  }

  const settings: any = {};
  
  for (const row of data || []) {
    const key = row.setting_key;
    let value = row.setting_value;

    if (typeof value === 'string') {
      try {
        value = JSON.parse(value);
      } catch {
        value = Number(value) || value;
      }
    }

    settings[key] = value;
  }

  cachedSettings = settings as EconomySettings;
  lastFetch = now;

  return cachedSettings;
}

export async function getCallCost(): Promise<number> {
  const settings = await getEconomySettings();
  return settings.call_connect_cost || 40;
}

export async function getGiftCost(giftKey: string): Promise<number> {
  const settings = await getEconomySettings();
  return settings.gifts?.[giftKey]?.coins || 0;
}

export async function checkSpendingLimit(
  userId: string,
  coins: number,
  type: 'purchase' | 'spend' | 'gift'
): Promise<{ allowed: boolean; reason?: string }> {
  const { data, error } = await supabase.rpc('check_spending_limit', {
    p_user_id: userId,
    p_coins: coins,
    p_type: type,
  });

  if (error) {
    console.error('Failed to check spending limit:', error);
    return { allowed: false, reason: 'Failed to check limit' };
  }

  return data?.[0] || { allowed: false, reason: 'Unknown error' };
}

export async function spendCoins(
  userId: string,
  coins: number,
  type: 'call' | 'gift' | 'ai_usage',
  metadata?: Record<string, any>
): Promise<{ success: boolean; message: string; new_balance: number }> {
  const { data, error } = await supabase.rpc('spend_coins', {
    p_user_id: userId,
    p_coins: coins,
    p_type: type,
    p_metadata: metadata || {},
  });

  if (error) {
    console.error('Failed to spend coins:', error);
    throw error;
  }

  return data?.[0] || { success: false, message: 'Unknown error', new_balance: 0 };
}

export async function creditCoins(
  userId: string,
  coins: number,
  type: 'purchase' | 'refund' | 'bonus',
  metadata?: Record<string, any>
): Promise<{ success: boolean; message: string; new_balance: number }> {
  const { data, error } = await supabase.rpc('credit_coins', {
    p_user_id: userId,
    p_coins: coins,
    p_type: type,
    p_metadata: metadata || {},
  });

  if (error) {
    console.error('Failed to credit coins:', error);
    throw error;
  }

  return data?.[0] || { success: false, message: 'Unknown error', new_balance: 0 };
}

export function clearEconomyCache() {
  cachedSettings = null;
  lastFetch = 0;
}
