import React from "react";
import { Redirect } from "expo-router";
import { useUser } from "@/providers/UserProvider";
import { ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function IndexScreen() {
  const context = useUser();
  const { user, isLoading } = context || { user: null, isLoading: true };

  if (!context || isLoading) {
    return (
      <SafeAreaView style={styles.loading}>
        <ActivityIndicator size="large" color="#F04F8F" />
      </SafeAreaView>
    );
  }

  if (!user) {
    return <Redirect href="/auth" />;
  }

  return <Redirect href="/(tabs)/home" />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#111315",
  },
});