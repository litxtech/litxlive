export const Colors = {
  primary: "#9B51E0",
  primaryEnd: "#FF2D85",
  secondary: "#5B8CFF",
  mint: "#24D6A5",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  
  backgroundColor: "#FFFFFF",
  background: "#FFFFFF",
  surface: "#FFFFFF",
  card: "#FFFFFF",
  
  text: "#111111",
  textSecondary: "#666666",
  textMuted: "#9AA0A6",
  
  border: "#ECEFF3",
  borderLight: "#F5F5F5",
  
  overlay: "rgba(0, 0, 0, 0.5)",
  
  gradients: {
    primary: ["#9B51E0", "#FF2D85"],
    secondary: ["#5B8CFF", "#24D6A5"],
    purple: ["#9B51E0", "#BA68F7"],
    pink: ["#FF2D85", "#FF6B9D"],
    success: ["#10B981", "#34D399"],
    warning: ["#F59E0B", "#FBBF24"],
  },
  
  shadow: "rgba(17, 17, 17, 0.06)",
} as const;

export default {
  light: {
    text: "#111111",
    background: "#FFFFFF",
    tint: "#9B51E0",
    tabIconDefault: "#9AA0A6",
    tabIconSelected: "#9B51E0",
  },
};