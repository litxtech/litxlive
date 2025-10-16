import { ADMIN_WALLET_API } from '@/lib/adminWalletEnv';
import { getAdminToken } from '@/lib/adminSession';

export interface WalletBalanceResponse {
  user_id: string;
  balance: number;
  currency: string;
  updated_at?: string;
}

export interface WalletTransaction {
  id: string;
  user_id: string;
  type: 'credit' | 'debit';
  amount: number;
  currency: string;
  reason?: string;
  created_at: string;
}

async function fetchWallet<T>(path: string, init?: RequestInit): Promise<T> {
  if (!ADMIN_WALLET_API) {
    throw new Error('ADMIN_WALLET_API is not configured');
  }

  const token = (await getAdminToken()) ?? '';
  const url = path.startsWith('http') ? path : `${ADMIN_WALLET_API}${path}`;

  const res = await fetch(url, {
    ...init,
    credentials: 'omit',
    headers: {
      Accept: 'application/json',
      ...(init?.headers as Record<string, string> | undefined),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.error('[adminWallet] fetch error', { url, status: res.status, text });
    throw new Error(text || `Wallet API error ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export const adminWallet = {
  async getBalance(userId: string): Promise<WalletBalanceResponse> {
    if (!userId) throw new Error('userId is required');
    const q = `?user_id=${encodeURIComponent(userId)}`;
    return fetchWallet<WalletBalanceResponse>(`/wallet/balance${q}`);
  },

  async listTransactions(userId: string): Promise<WalletTransaction[]> {
    if (!userId) throw new Error('userId is required');
    const q = `?user_id=${encodeURIComponent(userId)}`;
    return fetchWallet<WalletTransaction[]>(`/wallet/transactions${q}`);
  },

  async credit(userId: string, amount: number, reason?: string): Promise<{ ok: true }>{
    if (!userId) throw new Error('userId is required');
    if (!Number.isFinite(amount) || amount <= 0) throw new Error('amount must be > 0');
    return fetchWallet<{ ok: true }>(`/wallet/credit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, amount, reason }),
    });
  },

  async debit(userId: string, amount: number, reason?: string): Promise<{ ok: true }>{
    if (!userId) throw new Error('userId is required');
    if (!Number.isFinite(amount) || amount <= 0) throw new Error('amount must be > 0');
    return fetchWallet<{ ok: true }>(`/wallet/debit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, amount, reason }),
    });
  },
};
