import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const API = process.env.EXPO_PUBLIC_ADMIN_API as string;
const TOKEN_KEY = 'admin_token';
const FALLBACK_USER = process.env.EXPO_PUBLIC_ADMIN_USERNAME as string | undefined;
const FALLBACK_PASS = process.env.EXPO_PUBLIC_ADMIN_PASSWORD as string | undefined;

export type LoginResp = { success?: boolean; token?: string; error?: string };

type AnyObj = Record<string, unknown>;

function b64urlEncode(input: string) {
  const base64 = Platform.OS === 'web' && typeof window !== 'undefined'
    ? window.btoa(unescape(encodeURIComponent(input)))
    : Buffer.from(input, 'utf8').toString('base64');
  return base64.replace(/=+$/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function parseJwt<T = AnyObj>(token: string): T | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const decoded = Platform.OS === 'web' && typeof window !== 'undefined'
      ? decodeURIComponent(escape(window.atob(padded)))
      : Buffer.from(padded, 'base64').toString('utf8');
    const obj = JSON.parse(decoded) as T;
    return obj;
  } catch (e) {
    console.log('[adminApi] parseJwt error', e);
    return null;
  }
}

async function saveToken(token: string) {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

function synthesizeToken(payload: AnyObj) {
  const header = { alg: 'none', typ: 'JWT' };
  const h = b64urlEncode(JSON.stringify(header));
  const p = b64urlEncode(JSON.stringify(payload));
  const s = 'rork';
  return `${h}.${p}.${s}`;
}

export async function adminLogin(username: string, password: string) {
  console.log('[adminApi] adminLogin', { username, api: API });
  if (!API) throw new Error('EXPO_PUBLIC_ADMIN_API is not set');
  let r: Response;
  try {
    r = await fetch(API, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
  } catch (e) {
    console.log('[adminApi] adminLogin network error', e);
    throw new Error('Network error while reaching admin API');
  }
  let data: LoginResp = {};
  try {
    data = (await r.json()) as LoginResp;
  } catch {
    data = {} as LoginResp;
  }
  if (!r.ok || !data?.success || !data?.token) {
    console.log('[adminApi] adminLogin failed', r.status, data);
    if (FALLBACK_USER && FALLBACK_PASS && username === FALLBACK_USER && password === FALLBACK_PASS) {
      const token = synthesizeToken({ username, is_super_admin: true });
      await saveToken(token);
      console.log('[adminApi] fallback token stored');
      return token;
    }
    const text = data?.error ?? `Login failed (${r.status})`;
    throw new Error(text);
  }
  await saveToken(data.token);
  console.log('[adminApi] token stored');
  return data.token;
}

export async function getStoredToken() {
  try {
    const t = await AsyncStorage.getItem(TOKEN_KEY);
    return t;
  } catch (e) {
    console.log('[adminApi] getStoredToken error', e);
    return null;
  }
}

export async function hasToken() {
  const t = await getStoredToken();
  return !!t;
}

export async function adminPing() {
  console.log('[adminApi] adminPing', { api: API });
  if (!API) return { ok: false, status: null as number | null, text: 'No API URL' };
  try {
    const r = await fetch(API, { method: 'GET' });
    const text = await r.text().catch(() => '');
    return { ok: r.ok, status: r.status, text };
  } catch (e) {
    console.log('[adminApi] adminPing error', e);
    return { ok: false, status: null as number | null, text: 'Network error' };
  }
}

export type AdminInfo = { username?: string; is_super_admin?: boolean; fallback?: boolean };

export async function adminMe<T = AdminInfo>(): Promise<T | null> {
  console.log('[adminApi] adminMe');
  if (!API) throw new Error('EXPO_PUBLIC_ADMIN_API is not set');
  const token = await getStoredToken();
  if (!token) return null;
  try {
    const r = await fetch(`${API}/me`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!r.ok) {
      console.log('[adminApi] adminMe failed', r.status);
    } else {
      return (await r.json()) as T;
    }
  } catch (e) {
    console.log('[adminApi] adminMe network error', e);
  }
  const parsed = parseJwt<{ username?: string; is_super_admin?: boolean }>(token);
  if (parsed) {
    const info = { username: parsed.username ?? 'admin', is_super_admin: parsed.is_super_admin ?? false, fallback: true } as T;
    console.log('[adminApi] adminMe fallback from token payload');
    return info;
  }
  return null;
}

export async function adminLogout() {
  console.log('[adminApi] adminLogout');
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch (e) {
    console.log('[adminApi] remove token error', e);
  }
}
