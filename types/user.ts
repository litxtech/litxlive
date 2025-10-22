export interface User {
  id: string;
  userId: string;
  walletId: string;
  email: string;
  displayName: string;
  username: string;
  phone?: string;
  avatar?: string;
  bio?: string;
  coins: number;
  aiCredits?: number;
  level: number;
  isVip: boolean;
  isVerified?: boolean;
  country?: string;
  city?: string;
  hometown?: string;
  hometownCity?: string;
  hometownCountry?: string;
  hometownSlug?: string;
  hometownVisible?: boolean;
  languages: string[];
  firstName?: string;
  lastName?: string;
  gender?: string;
  orientation?: string;
  birthDate?: string;
  interests?: string;
  website?: string;
  createdAt: string;
  // Admin/owner claims
  role?: 'user' | 'creator' | 'owner';
  owner_level?: number | null;
  
  // LUMI-ID System
  lumiId?: string;
  
  // Verification status
  emailVerified?: boolean;
  phoneVerified?: boolean;
  identityVerified?: boolean;
  selfieVerified?: boolean;
  verificationStatus?: 'none' | 'pending' | 'verified' | 'rejected';
  verificationLevel?: 'none' | 'yellow' | 'blue';
  
  // Agency status
  isAgency?: boolean;
  agencyStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  agencyTier?: 'basic' | 'silver' | 'gold' | 'platinum';
  
  // Stats
  totalStreams?: number;
  totalFollowers?: number;
  totalGiftsReceived?: number;
  totalGiftsSent?: number;
  totalMessages?: number;
  rating?: number;
  
  // Preferences
  preferredLanguages?: string[];
  preferredCountries?: string[];
  ageRange?: [number, number];
  autoTranslate?: boolean;
  
  // Status
  isOnline?: boolean;
  lastSeen?: string;
  currentStatus?: "available" | "busy" | "away";
}

export interface UserProfile extends User {
  followers: string[];
  following: string[];
  blockedUsers: string[];
  achievements: Achievement[];
}

export interface Achievement {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  maxProgress: number;
  rewardCoins: number;
  rewardAiCredits: number;
  unlockedAt?: string;
  progress?: number;
  isActive: boolean;
}

export interface VerificationRequest {
  id: string;
  userId: string;
  type: 'identity' | 'selfie' | 'agency';
  status: 'pending' | 'approved' | 'rejected';
  documentUrl?: string;
  selfieUrl?: string;
  notes?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BlockedUser {
  id: string;
  blockerId: string;
  blockedId: string;
  blockedUser?: User;
  reason?: string;
  createdAt: string;
}