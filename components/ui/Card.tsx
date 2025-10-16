import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { Colors } from "@/constants/colors";

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  noPadding?: boolean;
  noShadow?: boolean;
}

export function Card({ children, style, noPadding, noShadow }: CardProps) {
  return (
    <View
      style={[
        styles.card,
        noPadding && styles.noPadding,
        noShadow && styles.noShadow,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 4,
  },
  noPadding: {
    padding: 0,
  },
  noShadow: {
    shadowOpacity: 0,
    elevation: 0,
  },
});
