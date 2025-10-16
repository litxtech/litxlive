import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams, usePathname } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/providers/UserProvider';

export default function AuthCallbackScreen() {
  const params = useLocalSearchParams();
  const pathname = usePathname();
  const { login } = useUser();

  useEffect(() => {
    handleCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCallback = async () => {
    try {
      console.log('[AuthCallback] Handling auth callback', { params, pathname });

      if (!supabase) {
        console.error('[AuthCallback] Supabase not initialized');
        router.replace('/auth');
        return;
      }

      // Attempt to exchange authorization code (OAuth PKCE and some email links)
      const code = typeof params.code === 'string' ? params.code : Array.isArray(params.code) ? params.code[0] : undefined;
      const tokenHash = ((): string | undefined => {
        const th = (params.token_hash ?? params.token) as string | string[] | undefined;
        if (!th) return undefined;
        return typeof th === 'string' ? th : th[0];
      })();
      const typeParam = typeof params.type === 'string' ? params.type : Array.isArray(params.type) ? params.type[0] : undefined;

      if (code) {
        console.log('[AuthCallback] Exchanging code for session');
        const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
        if (exErr) {
          console.error('[AuthCallback] exchangeCodeForSession error:', exErr);
        }
      } else if (tokenHash) {
        const verifyType = (typeParam as any) ?? ('magiclink' as const);
        console.log('[AuthCallback] Verifying token hash via verifyOtp', { verifyType });
        const { error: vErr } = await supbaseVerifyOtpSafe(tokenHash, verifyType);
        if (vErr) {
          console.error('[AuthCallback] verifyOtp error:', vErr);
        }
      }

      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('[AuthCallback] Session error:', error);
        router.replace('/auth');
        return;
      }

      if (session?.user) {
        console.log('[AuthCallback] User authenticated:', session.user.id);
        
        const display = (session.user.user_metadata?.display_name || session.user.user_metadata?.full_name || session.user.email!.split('@')[0]);
        const userData = {
          id: session.user.id,
          email: session.user.email!,
          displayName: display,
          username: display.toLowerCase().replace(/\s+/g, ''),
          emailVerified: (session.user as any).email_confirmed_at != null,
          phoneVerified: false,
        };

        await login(userData);
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('gender, age, city')
          .eq('user_id', session.user.id)
          .single();
        
        const isComplete = profile && profile.gender && profile.age && profile.city;
        router.replace(isComplete ? '/(tabs)/home' : '/onboarding');
      } else {
        console.log('[AuthCallback] No session found after callback handling');
        router.replace('/auth');
      }
    } catch (error) {
      console.error('[AuthCallback] Error:', error);
      router.replace('/auth');
    }
  };

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#F04F8F" />
      <Text style={styles.text}>Completing authentication...</Text>
    </View>
  );
}

async function supbaseVerifyOtpSafe(token_hash: string, type: 'magiclink' | 'recovery' | 'signup' | 'email') {
  try {
    if (!supabase) return { error: new Error('Supabase not initialized') } as const;
    const { error } = await supabase.auth.verifyOtp({ token_hash, type });
    return { error } as const;
  } catch (e) {
    return { error: e as Error } as const;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111315',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  text: {
    color: 'white',
    fontSize: 16,
  },
});
