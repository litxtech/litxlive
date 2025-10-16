import { Platform } from 'react-native';

export type CurrencyCode =
  | 'USD'
  | 'EUR'
  | 'GBP'
  | 'TRY'
  | 'AED'
  | 'SAR'
  | 'KWD'
  | 'QAR'
  | 'OMR';

export type IapPackage = {
  id: string;
  name: string;
  coins: number;
  aiCredits: number;
  premiumMinutes: number;
  price: number;
  currency: CurrencyCode;
  popular?: boolean;
  badge?: string;
  productId?: string;
  tier?: 'mini' | 'starter' | 'basic' | 'value' | 'popular' | 'pro' | 'premium' | 'elite' | 'mega' | 'ultimate';
  features?: string[];
};

export const COMPANY_INFO = {
  name: 'Lumi Live Ltd.',
  address: '71-75 Shelton Street, London, WC2H 9JQ, United Kingdom',
  email: {
    support: 'support@lumilive.app',
    billing: 'billing@lumilive.app',
  },
} as const;

export function formatPrice(amount: number, currency: CurrencyCode = 'USD'): string {
  try {
    const locale = Platform.select({ web: (typeof navigator !== 'undefined' ? (navigator as any)?.language : 'en-US') ?? 'en-US', default: 'en-US' });
    return new Intl.NumberFormat(locale as string, { style: 'currency', currency }).format(amount);
  } catch (e) {
    console.log('[iapPackages] formatPrice fallback', e);
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export const CURRENCY_RATES: Record<CurrencyCode, { symbol: string; rateToUSD: number }> = {
  USD: { symbol: '$', rateToUSD: 1 },
  EUR: { symbol: '€', rateToUSD: 1.08 },
  GBP: { symbol: '£', rateToUSD: 1.27 },
  TRY: { symbol: '₺', rateToUSD: 0.03 },
  AED: { symbol: 'د.إ', rateToUSD: 0.27 },
  SAR: { symbol: '﷼', rateToUSD: 0.27 },
  KWD: { symbol: 'د.ك', rateToUSD: 3.24 },
  QAR: { symbol: 'ر.ق', rateToUSD: 0.27 },
  OMR: { symbol: 'ر.ع.', rateToUSD: 2.6 },
};

export const IAP_PACKAGES: IapPackage[] = [
  {
    id: 'coins_mini_199',
    name: 'Mini Pack',
    coins: 250,
    aiCredits: 10,
    premiumMinutes: 2,
    price: 1.99,
    currency: 'USD',
    badge: '🎁',
  },
  {
    id: 'coins_starter_299',
    name: 'Starter Pack',
    coins: 400,
    aiCredits: 15,
    premiumMinutes: 4,
    price: 2.99,
    currency: 'USD',
    badge: '⭐',
  },
  {
    id: 'coins_basic_499',
    name: 'Basic Pack',
    coins: 700,
    aiCredits: 25,
    premiumMinutes: 7,
    price: 4.99,
    currency: 'USD',
    badge: '💎',
  },
  {
    id: 'coins_value_799',
    name: 'Value Pack',
    coins: 1200,
    aiCredits: 45,
    premiumMinutes: 12,
    price: 7.99,
    currency: 'USD',
    badge: '🔥',
  },
  {
    id: 'coins_popular_999',
    name: 'Popular Pack',
    coins: 1600,
    aiCredits: 60,
    premiumMinutes: 16,
    price: 9.99,
    currency: 'USD',
    popular: true,
    badge: '🌟',
  },
  {
    id: 'coins_pro_1499',
    name: 'Pro Pack',
    coins: 2500,
    aiCredits: 100,
    premiumMinutes: 25,
    price: 14.99,
    currency: 'USD',
    badge: '👑',
  },
  {
    id: 'coins_premium_1999',
    name: 'Premium Pack',
    coins: 3500,
    aiCredits: 150,
    premiumMinutes: 35,
    price: 19.99,
    currency: 'USD',
    badge: '💫',
  },
  {
    id: 'coins_elite_2999',
    name: 'Elite Pack',
    coins: 5500,
    aiCredits: 250,
    premiumMinutes: 55,
    price: 29.99,
    currency: 'USD',
    badge: '🚀',
  },
  {
    id: 'coins_mega_4999',
    name: 'Mega Pack',
    coins: 10000,
    aiCredits: 500,
    premiumMinutes: 100,
    price: 49.99,
    currency: 'USD',
    badge: '💰',
  },
  {
    id: 'coins_ultimate_9999',
    name: 'Ultimate Pack',
    coins: 22000,
    aiCredits: 1200,
    premiumMinutes: 220,
    price: 99.99,
    currency: 'USD',
    badge: '🏆',
  },
] as const;

export const COIN_TO_PRODUCT_MAP: Record<string, number> = Object.fromEntries(
  (IAP_PACKAGES as IapPackage[]).map((p) => [(p.productId ?? p.id), p.coins])
);

export function getPackageById(id: string): IapPackage | undefined {
  return (IAP_PACKAGES as IapPackage[]).find((p) => p.id === id || p.productId === id);
}

export default IAP_PACKAGES;
