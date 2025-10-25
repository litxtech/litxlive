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
  const timeoutMs = 60000; // 30s -> 60s
  const controller = new AbortController();
  const id = setTimeout(() => {
    console.warn('[Supabase][fetch] Request timeout after 60s:', input);
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
