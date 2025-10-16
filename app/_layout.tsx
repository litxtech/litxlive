import "@rork/polyfills";
import { BundleInspector } from '@rork/inspector';
import { RorkSafeInsets } from '@rork/safe-insets';
import { RorkErrorBoundary } from '@rork/rork-error-boundary';
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
      } catch (e) {
        console.log('[SplashScreen] preventAutoHideAsync error', e);
      }
      try {
        await SplashScreen.hideAsync();
      } catch (e) {
        console.log('[SplashScreen] hideAsync error', e);
      }
    })();

    WebBrowser.maybeCompleteAuthSession();

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

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <UserProvider>
            <AdminProvider>
              <OwnerProvider>
                <PolicyProvider>
                  <ThemeProvider value={DefaultTheme}>
                    <GestureHandlerRootView style={styles.container}>
                      <StatusBar style="light" />
                      <ErrorBoundary>
                        <BundleInspector><RorkSafeInsets><RorkErrorBoundary><RootLayoutNav /></RorkErrorBoundary></RorkSafeInsets></BundleInspector>
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
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});