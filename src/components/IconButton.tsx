import React, { type ComponentProps } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { colors, radii } from "@/theme";

type IconButtonProps = {
  name: ComponentProps<typeof Ionicons>["name"];
  onPress: (event: GestureResponderEvent) => void;
  accessibilityLabel: string;
  color?: string;
  backgroundColor?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

export function IconButton({
  name,
  onPress,
  accessibilityLabel,
  color = colors.ink,
  backgroundColor = colors.surface,
  size = 22,
  style,
}: IconButtonProps) {
  const handlePress = (event: GestureResponderEvent) => {
    if (Platform.OS !== "web") void Haptics.selectionAsync();
    onPress(event);
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor },
        pressed ? styles.pressed : undefined,
        style,
      ]}
    >
      <Ionicons name={name} size={size} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: { opacity: 0.78, transform: [{ scale: 0.96 }] },
});
