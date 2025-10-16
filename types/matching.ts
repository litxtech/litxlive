export interface MatchPreferences {
  languages: string[];
  countries: string[];
  ageRange: [number, number];
  gender?: "male" | "female" | "any";
  interests: string[];
}

export interface Match {
  id: string;
  userA: string;
  userB: string;
  startedAt: string;
  endedAt?: string;
  roomUrl: string;
  status: "active" | "ended" | "reported";
  
  // Billing
  costPerMinute: number;
  totalCost: number;
  paidBy: string;
  
  // Feedback
  ratingA?: number;
  ratingB?: number;
  reportedBy?: string;
  reportReason?: string;
}

export interface MatchQueue {
  userId: string;
  preferences: MatchPreferences;
  joinedAt: string;
  priority: number;
}