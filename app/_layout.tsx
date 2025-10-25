// import "@rork/polyfills";
// import { BundleInspector } from '@rork/inspector';
// import { RorkSafeInsets } from '@rork/safe-insets';
// import { RorkErrorBoundary } from '@rork/rork-error-boundary';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import * as SplashScreen from "expo-splash-screen";
import * as WebBrowser from "expo-web-browser";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Platform } from "react-native";
import { UserProvider } from "@/providers/UserProvider";
import { LanguageProvider } from "@/providers/LanguageProvider";
import { AdminProvider } from "@/providers/AdminProvider";
import { OwnerProvider } from "@/providers/OwnerProvider";
import { trpc, trpcClient } from "@/lib/trpc";
import ErrorBoundary from "@/components/ErrorBoundary";
import { PolicyProvider, usePolicies } from "@/providers/PolicyProvider";
import PolicyModal from "@/components/PolicyModal";
import LumiAssistant from "@/components/LumiAssistant";

import { Stack } from "expo-router";
import { ThemeProvider, DefaultTheme } from "@react-navigation/native";
// Conditional Stripe imports for web compatibility
let StripeProvider: any;
let stripeConfig: any;

if (Platform.OS !== 'web') {
  StripeProvider = require('@stripe/stripe-react-native').StripeProvider;
  stripeConfig = require('@/lib/stripe').stripeConfig;
}



const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="quick-match" options={{ headerShown: false }} />
      <Stack.Screen name="admin" options={{ headerShown: false }} />
      <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="profile/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="upload-post" options={{ headerShown: false }} />
      <Stack.Screen name="policies/index" options={{ title: 'Policies' }} />
      <Stack.Screen name="policies/[slug]" options={{ title: 'Policy' }} />
    </Stack>
  );
}

function PolicyGate() {
  const { pending } = usePolicies();
  const [visible, setVisible] = useState<boolean>(false);
  useEffect(() => {
    setVisible((pending?.length ?? 0) > 0);
  }, [pending]);
  return <PolicyModal visible={visible} onClose={() => setVisible(false)} />;
}

export default function RootLayout() {
  useEffect(() => {
    (async () => {
      try {
        await SplashScreen.preventAutoHideAsync();
        // Wait longer for app to initialize properly
        await new Promise(resolve => setTimeout(resolve, 2000));
        await SplashScreen.hideAsync();
      } catch (e) {
        console.log('[SplashScreen] error', e);
        // Force hide splash screen even if there's an error
        try {
          await SplashScreen.hideAsync();
        } catch (hideError) {
          console.log('[SplashScreen] hideAsync error', hideError);
        }
      }
    })();

    try {
      WebBrowser.maybeCompleteAuthSession();
    } catch (e) {
      console.log('[WebBrowser] error', e);
    }

    if (Platform.OS === 'web') {
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
      } else {
        const meta = document.createElement('meta');
        meta.name = 'viewport';
        meta.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no';
        document.head.appendChild(meta);
      }
    }
  }, []);

  const AppContent = () => (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <UserProvider>
            <AdminProvider>
              <OwnerProvider>
                <PolicyProvider>
                  <ThemeProvider value={DefaultTheme}>
                    <GestureHandlerRootView style={styles.container}>
                      <StatusBar style="dark" />
                      <ErrorBoundary>
                        <RootLayoutNav />
                        <PolicyGate />
                        <LumiAssistant />
                      </ErrorBoundary>
                    </GestureHandlerRootView>
                  </ThemeProvider>
                </PolicyProvider>
              </OwnerProvider>
            </AdminProvider>
          </UserProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );

  // Web için Stripe olmadan, mobile için Stripe ile
  if (Platform.OS === 'web') {
    return <AppContent />;
  }

  return (
    <StripeProvider publishableKey={stripeConfig.publishableKey}>
      <AppContent />
    </StripeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});