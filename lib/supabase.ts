import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const envUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const envAnon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!envUrl || !envAnon) {
  const details = `EXPO_PUBLIC_SUPABASE_URL set: ${!!envUrl}, EXPO_PUBLIC_SUPABASE_ANON_KEY set: ${!!envAnon}`;
  console.error('[Supabase] Missing required environment variables. Configure your .env or project settings. ' + details);
  throw new Error('Supabase yapılandırma hatası: Ortam değişkenleri eksik. Lütfen EXPO_PUBLIC_SUPABASE_URL ve EXPO_PUBLIC_SUPABASE_ANON_KEY değerlerini ayarlayın.');
}

const supabaseUrl = envUrl as string;
const supabaseAnonKey = envAnon as string;

const fetchWithTimeout: typeof fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const timeoutMs = 300000; // 120s -> 300s (5 dakika)
  const controller = new AbortController();
  const id = setTimeout(() => {
    console.warn('[Supabase][fetch] Request timeout after 300s:', input);
    controller.abort();
  }, timeoutMs);
  try {
    const res = await fetch(input, { ...(init ?? {}), signal: controller.signal });
    return res;
  } catch (e: any) {
    if (e?.name === 'AbortError') {
      console.error('[Supabase][fetch] Request timed out:', input);
      throw new Error('İstek zaman aşımına uğradı. Lütfen internet bağlantınızı kontrol edin.');
    }
    // Network error retry
    if (e?.message?.includes('NetworkError') || e?.message?.includes('fetch')) {
      console.warn('[Supabase][fetch] Network error, retrying...', input);
      // Retry once after 2 seconds
      await new Promise(resolve => setTimeout(resolve, 2000));
      try {
        const retryRes = await fetch(input, { ...(init ?? {}), signal: controller.signal });
        return retryRes;
      } catch (retryError) {
        console.error('[Supabase][fetch] Retry failed:', retryError);
        throw e; // Throw original error
      }
    }
    console.error('[Supabase][fetch] Network error:', e?.name, e?.message, input);
    throw e;
  } finally {
    clearTimeout(id);
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: Platform.OS === 'web' ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  global: {
    fetch: fetchWithTimeout,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

console.log('[Supabase] Client initialized with URL:', supabaseUrl);
