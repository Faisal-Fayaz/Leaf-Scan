import { Platform, type ViewStyle } from "react-native";

export const colors = {
  ink: "#17251D",
  inkSoft: "#34483B",
  muted: "#66766D",
  subtle: "#8A978F",
  canvas: "#F3F7F2",
  canvasWarm: "#F8F6EE",
  surface: "#FFFFFF",
  surfaceTint: "#EAF3E8",
  primary: "#2F6D48",
  primaryDark: "#173E2B",
  primaryLight: "#D9EBD7",
  lime: "#9ACB77",
  border: "#DCE6DC",
  borderStrong: "#C4D3C4",
  white: "#FFFFFF",
  black: "#0A100C",
  warning: "#A45C1B",
  warningSurface: "#FFF4E6",
  warningBorder: "#F0D3AE",
  danger: "#A33E32",
  dangerSurface: "#FFF0ED",
  neutralSurface: "#EEF1EF",
  cameraOverlay: "rgba(8, 19, 13, 0.72)",
  cameraPanel: "rgba(16, 32, 22, 0.88)",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
} as const;

export const radii = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;

export const shadows = {
  card: Platform.select<ViewStyle>({
    ios: {
      shadowColor: colors.primaryDark,
      shadowOpacity: 0.08,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 8 },
    },
    android: { elevation: 2 },
    default: {},
  }) ?? {},
  floating: Platform.select<ViewStyle>({
    ios: {
      shadowColor: colors.black,
      shadowOpacity: 0.2,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 10 },
    },
    android: { elevation: 8 },
    default: {},
  }) ?? {},
} as const;
