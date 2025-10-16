export type PushPlatform = 'ios' | 'android' | 'web';

export interface PushTokenRow {
  id: number;
  user_id: string;
  token: string;
  platform: PushPlatform;
  enabled: boolean;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PushPreferencesRow {
  user_id: string;
  marketing_enabled: boolean;
  system_enabled: boolean;
  created_at: string;
  updated_at: string;
}
