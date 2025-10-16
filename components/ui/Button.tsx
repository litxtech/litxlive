import React from "react";
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "@/constants/colors";

interface ButtonProps {
  children: string;
  onPress?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "outline" | "icon";
  size?: "small" | "medium" | "large";
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
}

interface IconButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  testID?: string;
}

export function PrimaryButton({
  children,
  onPress,
  disabled,
  size = "large",
  icon,
  style,
  textStyle,
  testID,
}: ButtonProps) {
  const heightMap = { small: 36, medium: 40, large: 48 };
  const fontSizeMap = { small: 13, medium: 14, large: 16 };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.buttonBase,
        { height: heightMap[size], opacity: disabled ? 0.5 : 1 },
        style,
      ]}
      activeOpacity={0.8}
      testID={testID}
    >
      <LinearGradient
        colors={Colors.gradients.primary}
        style={styles.gradientButton}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        {icon && icon}
        <Text style={[styles.primaryText, { fontSize: fontSizeMap[size] }, textStyle]}>
          {children}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

export function SecondaryButton({
  children,
  onPress,
  disabled,
  size = "medium",
  icon,
  style,
  textStyle,
  testID,
}: ButtonProps) {
  const heightMap = { small: 36, medium: 40, large: 48 };
  const fontSizeMap = { small: 13, medium: 14, large: 16 };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.buttonBase,
        styles.secondaryButton,
        { height: heightMap[size], opacity: disabled ? 0.5 : 1 },
        style,
      ]}
      activeOpacity={0.8}
      testID={testID}
    >
      {icon && icon}
      <Text style={[styles.secondaryText, { fontSize: fontSizeMap[size] }, textStyle]}>
        {children}
      </Text>
    </TouchableOpacity>
  );
}

export function IconButton({
  children,
  onPress,
  disabled,
  style,
  testID,
}: IconButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[styles.iconButton, { opacity: disabled ? 0.5 : 1 }, style]}
      activeOpacity={0.8}
      testID={testID}
    >
      {children}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  buttonBase: {
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  gradientButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    gap: 8,
  },
  secondaryButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  primaryText: {
    fontWeight: "600" as const,
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  secondaryText: {
    fontWeight: "600" as const,
    color: Colors.text,
  },
});
