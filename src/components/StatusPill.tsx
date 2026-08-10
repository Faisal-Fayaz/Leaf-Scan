import React, { type ComponentProps } from "react";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { colors, radii, spacing } from "@/theme";

export function StatusPill({
  label,
  icon = "leaf-outline",
  tone = "green",
  style,
}: {
  label: string;
  icon?: ComponentProps<typeof Ionicons>["name"];
  tone?: "green" | "dark" | "warning" | "neutral";
  style?: StyleProp<ViewStyle>;
}) {
  const palette = {
    green: { background: colors.primaryLight, foreground: colors.primaryDark },
    dark: { background: "rgba(12, 31, 20, 0.78)", foreground: colors.white },
    warning: { background: colors.warningSurface, foreground: colors.warning },
    neutral: { background: colors.neutralSurface, foreground: colors.inkSoft },
  }[tone];

  return (
    <View style={[styles.pill, { backgroundColor: palette.background }, style]}>
      <Ionicons name={icon} size={14} color={palette.foreground} />
      <Text style={[styles.label, { color: palette.foreground }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    minHeight: 30,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    alignSelf: "flex-start",
  },
  label: { fontSize: 11, lineHeight: 14, fontWeight: "900", letterSpacing: 0.7 },
});
