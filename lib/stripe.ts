import { StripeProvider } from '@stripe/stripe-react-native';

// Stripe public key - TEST KEY (for development)
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51SH7vZJlRtKdlIQv4zfrzePnoGNwKzoXyoqlKE512RWftxPZ7q4MvItAkbM4qwn8fMLKMUeJ6m2xlzgqvSNS4mC7002wTx4vkD';

export { STRIPE_PUBLISHABLE_KEY };

// Stripe configuration
export const stripeConfig = {
  publishableKey: STRIPE_PUBLISHABLE_KEY,
  merchantId: 'merchant.com.lumi.app', // iOS için gerekli
  urlScheme: 'lumi://', // Deep linking için
};

// Payment methods
export const PAYMENT_METHODS = {
  CARD: 'card',
  APPLE_PAY: 'apple_pay',
  GOOGLE_PAY: 'google_pay',
} as const;

// Coin packages
export const COIN_PACKAGES = [
  {
    id: 'coins_100',
    name: '100 Lumi Coins',
    coins: 100,
    price: 4.99,
    currency: 'USD',
    popular: false,
  },
  {
    id: 'coins_500',
    name: '500 Lumi Coins',
    coins: 500,
    price: 19.99,
    currency: 'USD',
    popular: true,
    bonus: 50, // 50 bonus coin
  },
  {
    id: 'coins_1000',
    name: '1000 Lumi Coins',
    coins: 1000,
    price: 39.99,
    currency: 'USD',
    popular: false,
    bonus: 200, // 200 bonus coin
  },
  {
    id: 'coins_2500',
    name: '2500 Lumi Coins',
    coins: 2500,
    price: 99.99,
    currency: 'USD',
    popular: false,
    bonus: 750, // 750 bonus coin
  },
];

// Subscription packages
export const SUBSCRIPTION_PACKAGES = [
  {
    id: 'standard_monthly',
    name: 'Standard',
    price: 9.99,
    currency: 'USD',
    interval: 'month',
    features: [
      'Unlimited video calls',
      'Advanced filters',
      'Priority matching',
      'Gift sending',
    ],
  },
  {
    id: 'gold_monthly',
    name: 'Gold',
    price: 19.99,
    currency: 'USD',
    interval: 'month',
    features: [
      'Everything in Standard',
      'VIP badge',
      'Profile boost',
      'Advanced analytics',
      'Priority support',
    ],
    popular: true,
  },
  {
    id: 'vip_monthly',
    name: 'VIP',
    price: 39.99,
    currency: 'USD',
    interval: 'month',
    features: [
      'Everything in Gold',
      'Exclusive features',
      'Premium gifts',
      'Custom profile themes',
      'Dedicated support',
    ],
  },
];
