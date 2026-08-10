import React, { type ComponentProps } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { colors, radii, spacing } from "@/theme";

type IconName = ComponentProps<typeof Ionicons>["name"];
type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "light";

type AppButtonProps = {
  label: string;
  onPress: (event: GestureResponderEvent) => void;
  icon?: IconName;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

const variantStyles: Record<
  ButtonVariant,
  { backgroundColor: string; borderColor: string; textColor: string }
> = {
  primary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    textColor: colors.white,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    textColor: colors.primaryDark,
  },
  ghost: {
    backgroundColor: "transparent",
    borderColor: "transparent",
    textColor: colors.primary,
  },
  danger: {
    backgroundColor: colors.dangerSurface,
    borderColor: colors.dangerSurface,
    textColor: colors.danger,
  },
  light: {
    backgroundColor: colors.white,
    borderColor: colors.white,
    textColor: colors.primaryDark,
  },
};

export function AppButton({
  label,
  onPress,
  icon,
  variant = "primary",
  disabled = false,
  loading = false,
  accessibilityLabel,
  style,
}: AppButtonProps) {
  const palette = variantStyles[variant];
  const isDisabled = disabled || loading;

  const handlePress = (event: GestureResponderEvent) => {
    if (Platform.OS !== "web") void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(event);
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: palette.backgroundColor,
          borderColor: palette.borderColor,
        },
        pressed && !isDisabled ? styles.pressed : undefined,
        isDisabled ? styles.disabled : undefined,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.textColor} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={19} color={palette.textColor} />}
          <Text style={[styles.label, { color: palette.textColor }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  label: { fontSize: 15, fontWeight: "800", letterSpacing: 0.1 },
  pressed: { opacity: 0.86, transform: [{ scale: 0.985 }] },
  disabled: { opacity: 0.48 },
});
