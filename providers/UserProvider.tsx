import createContextHook from "@nkzw/create-context-hook";
import { useState, useEffect, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { User } from "@/types/user";
import { authService } from "@/services/auth";
import LumiIdService from "@/lib/lumiId";
import VerificationService from "@/lib/verification";

const STORAGE_KEY = "litx_user";

export const [UserProvider, useUser] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const persistAndSet = useCallback(async (userData: User | null) => {
    try {
      if (userData) {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
      } else {
        await AsyncStorage.removeItem(STORAGE_KEY);
      }
      setUser(userData);
    } catch (error: any) {
      console.error("[UserProvider] Persist error:", error?.message || String(error));
    }
  }, []);

  const hydrateFromSupabase = useCallback(async () => {
    try {
      console.log("[UserProvider] Hydrating from Supabase session...");
      // Add delay to prevent race conditions
      await new Promise(resolve => setTimeout(resolve, 500));
      
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored && stored.trim()) {
          const trimmed = stored.trim();
          if (trimmed.startsWith('{') && trimmed.endsWith('}') && trimmed.length > 10) {
            try {
              const parsed = JSON.parse(trimmed);
              if (!parsed || typeof parsed !== 'object' || !parsed.id) {
                console.error("[UserProvider] Invalid user object in storage, clearing");
                await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
              } else {
                setUser(parsed);
                console.log("[UserProvider] Loaded cached user, will refresh in background");
              }
            } catch (parseError: any) {
              const errorMsg = parseError instanceof Error ? parseError.message : String(parseError);
              console.error("[UserProvider] Corrupted storage detected, clearing:", errorMsg);
              await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
            }
          } else {
            console.error("[UserProvider] Storage contains invalid data format, clearing");
            await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
          }
        }
      } catch (e: any) {
        const errorMsg = e instanceof Error ? e.message : String(e);
        console.error("[UserProvider] Storage check error:", errorMsg);
        await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
      }

      const sessionPromise = authService.getSession();
      const timeoutPromise = new Promise<null>((resolve) => {
        setTimeout(() => {
          console.warn("[UserProvider] Session fetch timeout, using cached data");
          resolve(null);
        }, 30000); // 15s -> 30s
      });

      const session = await Promise.race([sessionPromise, timeoutPromise]);
      if (session?.user) {
        console.log("[UserProvider] Session found, fetching profile...");
        
        const { supabase } = await import('@/lib/supabase');
        if (!supabase) {
          console.error("[UserProvider] Supabase not initialized");
          setIsLoading(false);
          return;
        }

        const profilePromise = supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        const profileTimeout = new Promise<{ data: null; error: any }>((resolve) => {
          setTimeout(() => {
            console.warn("[UserProvider] Profile fetch timeout");
            resolve({ data: null, error: { message: 'Timeout' } });
          }, 30000); // 10s -> 30s
        });

        const { data: profile, error: profileError } = await Promise.race([profilePromise, profileTimeout]);

        if (profileError) {
          console.error("[UserProvider] Profile fetch error:", profileError);
        }

        const display = profile?.display_name || session.user.user_metadata?.display_name || session.user.user_metadata?.full_name || session.user.email!.split("@")[0];
        const isSupport = (session.user.email || '').toLowerCase() === 'support@litxtech.com';
        // Generate LUMI-ID if not exists
        const lumiId = profile?.lumi_id || LumiIdService.generateLumiId();
        
        // Calculate verification level
        const verificationStatus = {
          phone: profile?.phone_verified || false,
          email: (session.user as any).email_confirmed_at != null,
          admin: isSupport,
          level: 'none' as const
        };
        const verificationLevel = VerificationService.calculateLevel(verificationStatus);

        const u: User = {
          id: session.user.id,
          userId: `LTX-${session.user.id.substring(0, 8)}`,
          walletId: `WALLET-${session.user.id.substring(0, 8)}`,
          email: session.user.email || "",
          displayName: display,
          username: profile?.username || display.toLowerCase().replace(/\s+/g, ""),
          phone: undefined,
          avatar: profile?.avatar_url,
          bio: profile?.bio,
          coins: isSupport ? 99999999 : (profile?.coins || 100),
          level: profile?.level || 1,
          isVip: profile?.is_vip || false,
          isVerified: Boolean((profile as any)?.blue_check ?? (profile as any)?.is_verified ?? false),
          country: profile?.country,
          hometownCity: undefined,
          hometownCountry: undefined,
          hometownSlug: undefined,
          hometownVisible: false,
          languages: profile?.languages || ["English"],
          emailVerified: (session.user as any).email_confirmed_at != null,
          phoneVerified: false,
          createdAt: profile?.created_at || new Date().toISOString(),
          // LUMI Features
          lumiId: lumiId,
          verificationLevel: verificationLevel,
        };
        await persistAndSet(u);
        return;
      }

      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored && stored.trim()) {
        try {
          const u = JSON.parse(stored) as User;
          if (u && typeof u === 'object' && u.id && u.email && u.displayName) {
            setUser(u);
          } else {
            console.error("[UserProvider] Invalid user object in storage, missing required fields");
            await AsyncStorage.removeItem(STORAGE_KEY);
            setUser(null);
          }
        } catch (parseError: any) {
          const errorMsg = parseError instanceof Error ? parseError.message : String(parseError);
          console.error("[UserProvider] Failed to parse stored user data:", errorMsg);
          await AsyncStorage.removeItem(STORAGE_KEY);
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (e: any) {
      let errorMsg = 'Unknown error';
      try {
        if (e instanceof Error) {
          errorMsg = e.message;
        } else if (typeof e === 'string') {
          errorMsg = e;
        } else if (e && typeof e === 'object') {
          errorMsg = e.message || e.toString?.() || 'Complex error object';
        } else {
          errorMsg = String(e);
        }
      } catch {
        errorMsg = 'Error serialization failed';
      }
      console.error("[UserProvider] hydrateFromSupabase error:", errorMsg);
      try {
        await AsyncStorage.removeItem(STORAGE_KEY);
      } catch (clearError: any) {
        console.error("[UserProvider] Failed to clear storage:", clearError?.message || String(clearError));
      }
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [persistAndSet]);

  const login = useCallback(async (userData: Partial<User>) => {
    if (!userData.email?.trim() || !userData.displayName?.trim()) {
      throw new Error("Email and display name are required");
    }
    if (userData.email.length > 100 || userData.displayName.length > 100) {
      throw new Error("Email and display name must be less than 100 characters");
    }

    const sanitizedEmail = userData.email.trim();
    const sanitizedDisplayName = userData.displayName.trim();
    const sanitizedPhone = userData.phone?.trim();

    const newUser: User = {
      id: userData.id || Date.now().toString(),
      userId: userData.userId || `LTX-${Date.now()}`,
      walletId: userData.walletId || `WALLET-${Date.now()}`,
      email: sanitizedEmail,
      displayName: sanitizedDisplayName,
      username: userData.username || `user${Date.now()}`,
      phone: sanitizedPhone,
      avatar: userData.avatar,
      bio: userData.bio,
      coins: userData.coins ?? 100,
      level: userData.level ?? 1,
      isVip: userData.isVip ?? false,
      country: userData.country,
      hometownCity: userData.hometownCity,
      hometownCountry: userData.hometownCountry,
      hometownSlug: userData.hometownSlug,
      hometownVisible: userData.hometownVisible ?? false,
      languages: userData.languages ?? ["English"],
      emailVerified: userData.emailVerified ?? false,
      phoneVerified: userData.phoneVerified ?? false,
      createdAt: userData.createdAt || new Date().toISOString(),
    };

    await persistAndSet(newUser);
  }, [persistAndSet]);

  const logout = useCallback(async () => {
    try {
      console.log('[UserProvider] Starting logout...');
      await persistAndSet(null);
      console.log('[UserProvider] User state cleared');
      const res = await authService.signOut();
      console.log('[UserProvider] Supabase sign out response:', res);
      if (!res.success) {
        console.error('[UserProvider] Sign out failed:', res.message);
      }
    } catch (error: any) {
      console.error('[UserProvider] Logout error:', error?.message || String(error));
      throw error;
    }
  }, [persistAndSet]);

  const updateUser = useCallback(async (updates: Partial<User>) => {
    if (!user) return;
    const updatedUser: User = { ...user, ...updates } as User;
    await persistAndSet(updatedUser);
  }, [user, persistAndSet]);

  const updateCoins = useCallback((amount: number) => {
    if (!user) return;
    const updatedUser: User = { ...user, coins: user.coins + amount } as User;
    persistAndSet(updatedUser);
  }, [user, persistAndSet]);

  const updateProfile = useCallback(async (profileData: any) => {
    if (!user) return;
    
    try {
      const { supabase } = await import('@/lib/supabase');
      if (!supabase) {
        throw new Error('Supabase not initialized');
      }

      // Update profile in database
        const { error } = await supabase
          .from('profiles')
          .update({
            display_name: profileData.displayName,
            username: profileData.username,
            bio: profileData.bio,
            city: profileData.city,
            gender: profileData.gender,
          })
          .eq('id', user.id);

      if (error) {
        console.error('[UserProvider] Profile update error:', error);
        throw error;
      }

      // Update local user state
      const updatedUser: User = {
        ...user,
        displayName: profileData.displayName,
        username: profileData.username,
        bio: profileData.bio,
        country: profileData.country,
        // Add other fields as needed
      } as User;
      
      await persistAndSet(updatedUser);
    } catch (error) {
      console.error('[UserProvider] Update profile error:', error);
      throw error;
    }
  }, [user, persistAndSet]);

  useEffect(() => {
    let unsub: { data: { subscription: { unsubscribe: () => void } } } | undefined;
    hydrateFromSupabase();

    unsub = authService.onAuthStateChange(async (event, session) => {
      console.log('[UserProvider] onAuthStateChange', { event, uid: session?.user?.id });
      if (session?.user) {
        const { supabase } = await import('@/lib/supabase');
        if (!supabase) {
          console.error("[UserProvider] Supabase not initialized");
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          const isSupport = (session.user.email || '').toLowerCase() === 'support@litxtech.com';
          const u: User = {
            id: session.user.id,
            userId: `LTX-${session.user.id.substring(0, 8)}`,
            walletId: `WALLET-${session.user.id.substring(0, 8)}`,
            email: session.user.email || "",
            displayName: profile.display_name || "User",
            username: profile.username || `user${session.user.id.substring(0, 8)}`,
            phone: undefined,
            avatar: profile.avatar_url,
            bio: profile.bio,
            coins: isSupport ? 99999999 : (profile.coins || 100),
            level: profile.level || 1,
            isVip: profile.is_vip || false,
            isVerified: Boolean((profile as any)?.blue_check ?? (profile as any)?.is_verified ?? false),
            country: profile.country,
            hometownCity: undefined,
            hometownCountry: undefined,
            hometownSlug: undefined,
            hometownVisible: false,
            languages: profile.languages || ["English"],
            emailVerified: (session.user as any).email_confirmed_at != null,
            phoneVerified: false,
            createdAt: profile.created_at || new Date().toISOString(),
          };
          await persistAndSet(u);
          try {
            // Push token registration moved to app startup to prevent native module errors
          } catch (e: any) {
            console.log('[UserProvider] push token save skipped:', e?.message || String(e));
          }
        } else {
          const display = (session.user.user_metadata?.display_name || session.user.user_metadata?.full_name || session.user.email!.split("@")[0]);
          const isSupport = (session.user.email || '').toLowerCase() === 'support@litxtech.com';
          const u: User = {
            id: session.user.id,
            userId: `LTX-${session.user.id.substring(0, 8)}`,
            walletId: `WALLET-${session.user.id.substring(0, 8)}`,
            email: session.user.email || "",
            displayName: display,
            username: display.toLowerCase().replace(/\s+/g, ""),
            phone: undefined,
            avatar: undefined,
            bio: undefined,
            coins: isSupport ? 99999999 : 100,
            level: 1,
            isVip: false,
            isVerified: false,
            country: undefined,
            hometownCity: undefined,
            hometownCountry: undefined,
            hometownSlug: undefined,
            hometownVisible: false,
            languages: ["English"],
            emailVerified: (session.user as any).email_confirmed_at != null,
            phoneVerified: false,
            createdAt: new Date().toISOString(),
          };
          await persistAndSet(u);
          try {
            // Push token registration moved to app startup to prevent native module errors
          } catch (e: any) {
            console.log('[UserProvider] push token save skipped:', e?.message || String(e));
          }
        }
      } else {
        await persistAndSet(null);
      }
    }) as any;

    return () => {
      try {
        unsub?.data?.subscription?.unsubscribe();
      } catch (e: any) {
        console.log('[UserProvider] unsubscribe error', e?.message || String(e));
      }
    };
  }, [hydrateFromSupabase, persistAndSet]);

  const refreshProfile = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { supabase } = await import('@/lib/supabase');
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        const u: User = {
          ...user,
          displayName: profile.display_name || user.displayName,
          username: profile.username || user.username,
          avatar: profile.avatar_url,
          bio: profile.bio,
          coins: user.email?.toLowerCase() === 'support@litxtech.com' ? 99999999 : (profile.coins || user.coins),
          level: profile.level || user.level,
          isVip: profile.is_vip || user.isVip,
          isVerified: Boolean((profile as any)?.blue_check ?? (profile as any)?.is_verified ?? user.isVerified ?? false),
          country: profile.country,
        };
        await persistAndSet(u);
      }
    } catch (error: any) {
      console.error('[UserProvider] refreshProfile error:', error?.message || String(error));
    }
  }, [user, persistAndSet]);

  return useMemo(() => ({
    user,
    isLoading,
    login,
    logout,
    updateUser,
    updateCoins,
    updateProfile,
    refreshProfile,
  }), [user, isLoading, login, logout, updateUser, updateCoins, updateProfile, refreshProfile]);
});