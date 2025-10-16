import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useUser } from '@/providers/UserProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ReauthState {
  required: boolean;
  reason?: string;
  requestedAt?: number;
}

interface OwnerContextValue {
  featureEnabled: boolean;
  isOwner: boolean;
  ownerLevel: number;
  adminMode: boolean;
  reauth: ReauthState;
  openAdminMode: (reason?: string) => void;
  closeAdminMode: () => void;
  requireReauthFor: (reason: string) => void;
  confirmReauth: (params: { password: string; otp?: string }) => Promise<boolean>;
  lastReauthAt?: number;
}

const ADMIN_FEATURE = (process.env.EXPO_PUBLIC_ADMIN_FEATURE ?? 'true').toString();
const STORAGE_KEY = 'owner_admin_mode';

export const [OwnerProvider, useOwner] = createContextHook<OwnerContextValue>(() => {
  const { user } = useUser();
  const [adminMode, setAdminMode] = useState<boolean>(false);
  const [reauth, setReauth] = useState<ReauthState>({ required: false });
  const [lastReauthAt, setLastReauthAt] = useState<number | undefined>(undefined);
  const reauthWindowMs = (Number(process.env.EXPO_PUBLIC_REAUTH_WINDOW_MINUTES ?? '5') || 5) * 60 * 1000;

  const featureEnabled = ADMIN_FEATURE !== 'false';
  const ownerLevel = (user?.owner_level ?? 0) || 0;
  const isOwner = (user?.role === 'owner') || ownerLevel >= 900;

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as { adminMode: boolean; lastReauthAt?: number };
          setAdminMode(Boolean(parsed.adminMode));
          setLastReauthAt(parsed.lastReauthAt);
        }
      } catch (e) {
        console.error('[OwnerProvider] Failed to hydrate', e);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ adminMode, lastReauthAt }));
      } catch (e) {
        console.error('[OwnerProvider] Failed to persist', e);
      }
    })();
  }, [adminMode, lastReauthAt]);

  const openAdminMode = useCallback((reason?: string) => {
    if (!featureEnabled) {
      console.warn('[OwnerProvider] ADMIN_FEATURE disabled');
      return;
    }
    if (!isOwner) {
      console.warn('[OwnerProvider] Not owner – ignoring admin mode open');
      return;
    }
    const now = Date.now();
    const valid = lastReauthAt && now - lastReauthAt < reauthWindowMs;
    if (!valid) {
      setReauth({ required: true, reason: reason ?? 'admin_mode_open', requestedAt: now });
    } else {
      setAdminMode(true);
    }
  }, [featureEnabled, isOwner, lastReauthAt, reauthWindowMs]);

  const closeAdminMode = useCallback(() => {
    setAdminMode(false);
  }, []);

  const requireReauthFor = useCallback((reason: string) => {
    setReauth({ required: true, reason, requestedAt: Date.now() });
  }, []);

  const confirmReauth = useCallback(async (params: { password: string; otp?: string }): Promise<boolean> => {
    try {
      console.log('[OwnerProvider] confirmReauth start', { hasPwd: params.password?.length > 0, hasOtp: (params.otp ?? '').length > 0 });
      if (!isOwner) return false;
      const pwdOk = (params.password ?? '').length >= 6;
      const otpOk = ((params.otp ?? '').length === 0) || (params.otp ?? '').length >= 6;
      if (!pwdOk || !otpOk) return false;
      const now = Date.now();
      setLastReauthAt(now);
      setReauth({ required: false });
      setAdminMode(true);
      return true;
    } catch (e) {
      console.error('[OwnerProvider] confirmReauth error', e);
      return false;
    }
  }, [isOwner]);

  return useMemo(() => ({
    featureEnabled,
    isOwner,
    ownerLevel,
    adminMode,
    reauth,
    openAdminMode,
    closeAdminMode,
    requireReauthFor,
    confirmReauth,
    lastReauthAt,
  }), [featureEnabled, isOwner, ownerLevel, adminMode, reauth, openAdminMode, closeAdminMode, requireReauthFor, confirmReauth, lastReauthAt]);
});
