import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from '@/services/supabase';
import type { PushPlatform, PushPreferencesRow } from '@/types/push';

async function getNotificationsModule(): Promise<any | null> {
  try {
    if (Platform.OS === 'web') return null;
    // Dynamic import via runtime Function to prevent TS resolver on web/Expo Go
    const mod = await (Function('return import("expo-notifications")')() as Promise<any>);
    return mod;
  } catch (e: any) {
    console.warn('[Push] expo-notifications not available in this environment:', e?.message);
    return null;
  }
}

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      console.log('[Push] Web platform: skipping push token retrieval');
      return null;
    }

    const Notifications = await getNotificationsModule();
    if (!Notifications) return null;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('[Push] Permission not granted');
      return null;
    }

    const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? (Constants as any)?.easConfig?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    const token: string | undefined = tokenData?.data;
    if (!token) {
      console.warn('[Push] No token returned');
      return null;
    }
    console.log('[Push] Got token:', token);
    return token;
  } catch (e: any) {
    console.error('[Push] register error:', e?.message);
    return null;
  }
}

export async function savePushToken(platform: PushPlatform): Promise<void> {
  try {
    const session = (await supabase.auth.getSession()).data.session;
    if (!session?.user?.id) {
      console.log('[Push] No user session; skipping save');
      return;
    }

    const token = await registerForPushNotificationsAsync();
    if (!token) return;

    const { error } = await supabase.rpc('lumi.upsert_push_token', {
      p_token: token,
      p_platform: platform,
    } as any);

    if (error) {
      console.error('[Push] upsert token error:', error.message);
    } else {
      console.log('[Push] Token saved');
    }
  } catch (e: any) {
    console.error('[Push] save token error:', e?.message);
  }
}

export async function setPushPreferences(marketing: boolean, system: boolean): Promise<PushPreferencesRow | null> {
  try {
    const { data, error } = await supabase.rpc('lumi.set_push_preferences', {
      p_marketing: marketing,
      p_system: system,
    } as any);

    if (error) {
      console.error('[Push] set prefs error:', error.message);
      return null;
    }
    return data as PushPreferencesRow;
  } catch (e: any) {
    console.error('[Push] set prefs error:', e?.message);
    return null;
  }
}

export async function getEnabledTokens(userIds?: string[]): Promise<{ user_id: string; token: string; platform: PushPlatform }[] | null> {
  try {
    const { data, error } = await supabase.rpc('lumi.get_enabled_tokens', { p_user_ids: userIds ?? null } as any);
    if (error) {
      console.error('[Push] get tokens error:', error.message);
      return null;
    }
    return (data ?? []) as any[];
  } catch (e: any) {
    console.error('[Push] get tokens error:', e?.message);
    return null;
  }
}
