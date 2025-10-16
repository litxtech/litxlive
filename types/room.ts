export interface LiveRoom {
  id: string;
  title: string;
  description?: string;
  hostId: string;
  hostName: string;
  hostAvatar: string;
  thumbnail: string;
  category: string;
  tags: string[];
  
  // Status
  isLive: boolean;
  startedAt: string;
  endedAt?: string;
  
  // Stats
  viewerCount: number;
  maxViewers: number;
  totalGifts: number;
  
  // Settings
  visibility: "public" | "private" | "password";
  password?: string;
  allowGuests: boolean;
  maxGuests: number;
  
  // Goals
  goalCoins?: number;
  currentGoalProgress?: number;
  
  // Moderation
  moderators: string[];
  bannedUsers: string[];
  
  // Technical
  roomUrl?: string;
  provider: "daily" | "100ms" | "agora";
}

export interface RoomMessage {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  message: string;
  translatedMessage?: string;
  timestamp: string;
  type: "text" | "gift" | "system";
  giftId?: string;
}

export interface Gift {
  id: string;
  name: string;
  icon: string;
  animationUrl?: string;
  price: number;
  category: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  streamerShare: number; // percentage
}