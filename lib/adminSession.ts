import AsyncStorage from '@react-native-async-storage/async-storage';

export const ADMIN_TOKEN_KEY = 'adm_token';

export async function saveAdminToken(token: string): Promise<void> {
  try {
    if (typeof window !== 'undefined' && (window as any)?.localStorage) {
      (window as any).localStorage.setItem(ADMIN_TOKEN_KEY, token);
    } else {
      await AsyncStorage.setItem(ADMIN_TOKEN_KEY, token);
    }
  } catch (e) {
    console.log('[adminSession] saveAdminToken error', e);
  }
}

export async function getAdminToken(): Promise<string | null> {
  try {
    if (typeof window !== 'undefined' && (window as any)?.localStorage) {
      return (window as any).localStorage.getItem(ADMIN_TOKEN_KEY);
    } else {
      return await AsyncStorage.getItem(ADMIN_TOKEN_KEY);
    }
  } catch (e) {
    console.log('[adminSession] getAdminToken error', e);
    return null;
  }
}

export async function clearAdminToken(): Promise<void> {
  try {
    if (typeof window !== 'undefined' && (window as any)?.localStorage) {
      (window as any).localStorage.removeItem(ADMIN_TOKEN_KEY);
    } else {
      await AsyncStorage.removeItem(ADMIN_TOKEN_KEY);
    }
  } catch (e) {
    console.log('[adminSession] clearAdminToken error', e);
  }
}
