import type { AppStateStatus } from "react-native";

export function shouldActivateCamera(
  isFocused: boolean,
  appState: AppStateStatus,
  busy: boolean
): boolean {
  return isFocused && appState === "active" && !busy;
}
