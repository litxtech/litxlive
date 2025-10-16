export type UUID = string;

export type MatchStatus = 'waiting'|'matched'|'connected'|'ended'|'cancelled';
export type CallStatus  = 'waiting'|'ringing'|'connected'|'ended'|'failed';
export type Gender = 'male' | 'female';
export type GenderPreference = 'male' | 'female' | 'both';

export interface Profile {
  id: UUID;
  user_id: UUID;
  username: string | null;
  display_name: string | null;
  gender: Gender | null;
  gender_preference: GenderPreference | null;
  age: number | null;
  city: string | null;
  country: string | null;
  avatar_url: string | null;
  bio: string | null;
  verified: boolean | null;
  last_seen: string;
  online_status: boolean;
  is_live: boolean;
  live_started_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Like {
  id: UUID;
  from_id: UUID;
  to_id: UUID;
  status: 'like' | 'pass';
  created_at: string;
}

export interface Match {
  id: UUID;
  user_a: UUID;
  user_b: UUID;
  created_at: string;
  status?: MatchStatus;
}

export interface Conversation {
  id: UUID;
  user_a: UUID;
  user_b: UUID;
  last_message_at: string | null;
  created_at: string;
}

export interface Message {
  id: UUID;
  conv_id: UUID;
  sender_id: UUID;
  content: string;
  created_at: string;
}

export interface Block {
  id: UUID;
  blocker_id: UUID;
  blocked_id: UUID;
  created_at: string;
}

export interface Report {
  id: UUID;
  reporter_id: UUID;
  reported_id: UUID;
  reason: string;
  created_at: string;
}

export interface FeedProfile extends Profile {
  distance?: number;
  is_online: boolean;
  last_seen_text: string;
}
