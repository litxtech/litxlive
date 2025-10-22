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
  // LUMI Coin Packages - Based on LUMI specifications
  {
    id: 'lumi_coins_200_299',
    name: 'LUMI Starter',
    coins: 200,
    aiCredits: 10,
    premiumMinutes: 2,
    price: 2.99,
    currency: 'USD',
    badge: '🎁',
    tier: 'mini',
    features: ['200 LUMI Coins', '2 dakika görüşme', 'Temel özellikler'],
  },
  {
    id: 'lumi_coins_500_699',
    name: 'LUMI Basic',
    coins: 500,
    aiCredits: 25,
    premiumMinutes: 5,
    price: 6.99,
    currency: 'USD',
    badge: '⭐',
    tier: 'starter',
    features: ['500 LUMI Coins', '5 dakika görüşme', 'Gelişmiş filtreler'],
  },
  {
    id: 'lumi_coins_1000_1299',
    name: 'LUMI Value',
    coins: 1000,
    aiCredits: 50,
    premiumMinutes: 10,
    price: 12.99,
    currency: 'USD',
    badge: '💎',
    tier: 'value',
    features: ['1000 LUMI Coins', '10 dakika görüşme', 'VIP özellikler'],
  },
  {
    id: 'lumi_coins_2500_2999',
    name: 'LUMI Popular',
    coins: 2500,
    aiCredits: 125,
    premiumMinutes: 25,
    price: 29.99,
    currency: 'USD',
    popular: true,
    badge: '🔥',
    tier: 'popular',
    features: ['2500 LUMI Coins', '25 dakika görüşme', 'Özel hediye paketleri'],
  },
  {
    id: 'lumi_coins_5000_5999',
    name: 'LUMI Pro',
    coins: 5000,
    aiCredits: 250,
    premiumMinutes: 50,
    price: 59.99,
    currency: 'USD',
    badge: '👑',
    tier: 'pro',
    features: ['5000 LUMI Coins', '50 dakika görüşme', 'Premium özellikler'],
  },
  {
    id: 'lumi_coins_10000_9999',
    name: 'LUMI Premium',
    coins: 10000,
    aiCredits: 500,
    premiumMinutes: 100,
    price: 99.99,
    currency: 'USD',
    badge: '💫',
    tier: 'premium',
    features: ['10000 LUMI Coins', '100 dakika görüşme', 'Tüm premium özellikler'],
  },
  {
    id: 'lumi_coins_15000_14999',
    name: 'LUMI Elite',
    coins: 15000,
    aiCredits: 750,
    premiumMinutes: 150,
    price: 149.99,
    currency: 'USD',
    badge: '🚀',
    tier: 'elite',
    features: ['15000 LUMI Coins', '150 dakika görüşme', 'Elite statü'],
  },
  {
    id: 'lumi_coins_25000_22999',
    name: 'LUMI Ultimate',
    coins: 25000,
    aiCredits: 1250,
    premiumMinutes: 250,
    price: 229.99,
    currency: 'USD',
    badge: '🏆',
    tier: 'ultimate',
    features: ['25000 LUMI Coins', '250 dakika görüşme', 'Ultimate statü'],
  },
] as const;

export const COIN_TO_PRODUCT_MAP: Record<string, number> = Object.fromEntries(
  (IAP_PACKAGES as IapPackage[]).map((p) => [(p.productId ?? p.id), p.coins])
);

export function getPackageById(id: string): IapPackage | undefined {
  return (IAP_PACKAGES as IapPackage[]).find((p) => p.id === id || p.productId === id);
}

export default IAP_PACKAGES;
