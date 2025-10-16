export interface Gift {
  id: string;
  name: string;
  emoji: string;
  coins: number;
  description: string;
  category: 'basic' | 'romantic' | 'premium' | 'luxury';
  animationUrl?: string;
}

export const GIFTS_CATALOG: Gift[] = [
  // Basic Gifts (10-50 coins)
  {
    id: 'balloon',
    name: 'Balloon',
    emoji: '🎈',
    coins: 10,
    description: 'Small greeting, sweet gesture',
    category: 'basic',
  },
  {
    id: 'rose',
    name: 'Rose',
    emoji: '🌹',
    coins: 25,
    description: 'Romantic classic',
    category: 'romantic',
  },
  {
    id: 'chocolate',
    name: 'Chocolate',
    emoji: '🍫',
    coins: 30,
    description: 'Sweet surprise',
    category: 'basic',
  },
  {
    id: 'butterfly',
    name: 'Butterfly',
    emoji: '🦋',
    coins: 40,
    description: 'Elegant animation',
    category: 'basic',
  },
  {
    id: 'diamond',
    name: 'Diamond',
    emoji: '💎',
    coins: 50,
    description: 'Precious gift',
    category: 'premium',
  },
  
  // Premium Gifts (75-150 coins)
  {
    id: 'trophy',
    name: 'Trophy',
    emoji: '🏆',
    coins: 75,
    description: 'Success and admiration',
    category: 'premium',
  },
  {
    id: 'microphone',
    name: 'Microphone',
    emoji: '🎤',
    coins: 80,
    description: 'Applause effect in live streams',
    category: 'premium',
  },
  {
    id: 'rocket',
    name: 'Rocket',
    emoji: '🚀',
    coins: 100,
    description: 'Explosive effect, stand out on stage',
    category: 'premium',
  },
  {
    id: 'violin',
    name: 'Violin',
    emoji: '🎻',
    coins: 120,
    description: 'Special music animation',
    category: 'premium',
  },
  {
    id: 'castle',
    name: 'Castle',
    emoji: '🏰',
    coins: 150,
    description: 'Prestige indicator',
    category: 'luxury',
  },
  
  // Luxury Gifts (200+ coins)
  {
    id: 'crown',
    name: 'Crown',
    emoji: '👑',
    coins: 200,
    description: 'VIP show, king/queen gesture',
    category: 'luxury',
  },
  {
    id: 'ufo',
    name: 'UFO',
    emoji: '🛸',
    coins: 250,
    description: 'Special effect + animation',
    category: 'luxury',
  },
  {
    id: 'sports_car',
    name: 'Sports Car',
    emoji: '🏎️',
    coins: 300,
    description: 'Big screen animation',
    category: 'luxury',
  },
  {
    id: 'jet',
    name: 'Jet',
    emoji: '✈️',
    coins: 400,
    description: 'Airplane animation, big gesture',
    category: 'luxury',
  },
  {
    id: 'yacht',
    name: 'Yacht',
    emoji: '🛳️',
    coins: 500,
    description: 'Ultra premium',
    category: 'luxury',
  },
  {
    id: 'fortress',
    name: 'Fortress',
    emoji: '🏰',
    coins: 1000,
    description: 'Top level, big screen celebration',
    category: 'luxury',
  },
];

export const COIN_PACKAGES = [
  {
    id: 'starter',
    coins: 100,
    aiCredits: 10,
    price: 0.99,
    currency: 'USD',
    bonus: 0,
    popular: false,
  },
  {
    id: 'basic',
    coins: 500,
    aiCredits: 25,
    price: 4.99,
    currency: 'USD',
    bonus: 50,
    popular: false,
  },
  {
    id: 'popular',
    coins: 1200,
    aiCredits: 50,
    price: 9.99,
    currency: 'USD',
    bonus: 200,
    popular: true,
  },
  {
    id: 'premium',
    coins: 2500,
    aiCredits: 100,
    price: 19.99,
    currency: 'USD',
    bonus: 500,
    popular: false,
  },
  {
    id: 'vip',
    coins: 5500,
    aiCredits: 200,
    price: 39.99,
    currency: 'USD',
    bonus: 1500,
    popular: false,
  },
  {
    id: 'ultimate',
    coins: 12000,
    aiCredits: 500,
    price: 79.99,
    currency: 'USD',
    bonus: 4000,
    popular: false,
  },
];

export const VIDEO_CALL_RATE = 8; // coins per minute
export const MIN_COINS_FOR_CALL = 16; // 2 minutes minimum
