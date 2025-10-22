export interface SubscriptionTier {
  id: string;
  name: string;
  price: number;
  currency: string;
  duration: 'monthly' | 'yearly';
  features: string[];
  benefits: {
    coins: number;
    dailyBonus: number;
    likeLimit: number;
    adFree: boolean;
    premiumFilters: boolean;
    profileVisitors: boolean;
    priorityMatching: boolean;
    unlimitedLikes: boolean;
    specialSupport: boolean;
    vipBadge: boolean;
    profileFrame: string;
  };
  popular?: boolean;
  badge?: string;
  color: string;
}

export const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  // Standart (Ücretsiz)
  {
    id: 'standard',
    name: 'Standart',
    price: 0,
    currency: 'USD',
    duration: 'monthly',
    features: [
      'Temel özellikler',
      'Reklam gösterimi',
      'Günlük 10 like limiti',
      'Temel filtreler',
      'Standart profil'
    ],
    benefits: {
      coins: 0,
      dailyBonus: 0,
      likeLimit: 10,
      adFree: false,
      premiumFilters: false,
      profileVisitors: false,
      priorityMatching: false,
      unlimitedLikes: false,
      specialSupport: false,
      vipBadge: false,
      profileFrame: 'standard'
    },
    color: '#6B7280',
    badge: '🥉'
  },
  
  // Gold ($7.99/ay)
  {
    id: 'gold',
    name: 'Gold',
    price: 7.99,
    currency: 'USD',
    duration: 'monthly',
    features: [
      'Reklamsız deneyim',
      'Günlük 50 bonus coin',
      'Gelişmiş filtreler',
      'Profil ziyaretçilerini görme',
      'Gold profil çerçevesi',
      'Günlük 50 like limiti'
    ],
    benefits: {
      coins: 0,
      dailyBonus: 50,
      likeLimit: 50,
      adFree: true,
      premiumFilters: true,
      profileVisitors: true,
      priorityMatching: false,
      unlimitedLikes: false,
      specialSupport: false,
      vipBadge: false,
      profileFrame: 'gold'
    },
    popular: true,
    color: '#FFD700',
    badge: '🥈'
  },
  
  // VIP ($19.99/ay)
  {
    id: 'vip',
    name: 'VIP',
    price: 19.99,
    currency: 'USD',
    duration: 'monthly',
    features: [
      'Tüm Gold özellikleri',
      '200 coin hoşgeldin bonusu',
      'VIP rozet ve profil çerçevesi',
      'Öncelikli eşleşme',
      'Sınırsız like',
      'Özel destek hattı',
      'VIP statü gösterimi'
    ],
    benefits: {
      coins: 200,
      dailyBonus: 100,
      likeLimit: -1, // Unlimited
      adFree: true,
      premiumFilters: true,
      profileVisitors: true,
      priorityMatching: true,
      unlimitedLikes: true,
      specialSupport: true,
      vipBadge: true,
      profileFrame: 'vip'
    },
    color: '#FF6B6B',
    badge: '🥇'
  }
];

export const YEARLY_DISCOUNT = 0.2; // 20% discount for yearly subscriptions

export function getSubscriptionPrice(tier: SubscriptionTier, isYearly: boolean = false): number {
  if (tier.price === 0) return 0;
  
  if (isYearly) {
    return tier.price * 12 * (1 - YEARLY_DISCOUNT);
  }
  
  return tier.price;
}

export function getSubscriptionFeatures(tier: SubscriptionTier): string[] {
  return tier.features;
}

export function getSubscriptionBenefits(tier: SubscriptionTier) {
  return tier.benefits;
}

export function isSubscriptionActive(userSubscription: any): boolean {
  if (!userSubscription) return false;
  
  const now = new Date();
  const expiryDate = new Date(userSubscription.expiresAt);
  
  return expiryDate > now && userSubscription.status === 'active';
}

export function getSubscriptionTierById(id: string): SubscriptionTier | undefined {
  return SUBSCRIPTION_TIERS.find(tier => tier.id === id);
}

export function getActiveSubscriptionTier(userSubscription: any): SubscriptionTier | undefined {
  if (!isSubscriptionActive(userSubscription)) {
    return getSubscriptionTierById('standard');
  }
  
  return getSubscriptionTierById(userSubscription.tier);
}

export default SUBSCRIPTION_TIERS;
