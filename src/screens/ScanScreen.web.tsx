import React from "react";
import { StyleSheet, Text, View } from "react-native";

/**
 * TensorFlow Lite and VisionCamera are native-only. Keeping a web-specific
 * entry point prevents those Nitro modules from being evaluated in browsers
 * and gives web visitors a useful, honest fallback instead of a startup crash.
 */
export function ScanScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.mark} accessibilityElementsHidden>
        <Text style={styles.markText}>L</Text>
      </View>
      <Text style={styles.kicker}>LEAFSCAN MOBILE</Text>
      <Text style={styles.title}>Scan leaves on your phone</Text>
      <Text style={styles.body}>
        On-device camera scanning is available in the Android and iOS app. The
        model runs locally so the photo does not need to be uploaded.
      </Text>
      <View style={styles.notice} accessibilityRole="text">
        <Text style={styles.noticeTitle}>Why scanning is unavailable here</Text>
        <Text style={styles.noticeBody}>
          This browser build does not load the native TensorFlow Lite or camera
          modules. Use LeafScan on a supported mobile device for a scan.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F4F7F1",
    padding: 28,
  },
  mark: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2F6B3D",
    marginBottom: 22,
  },
  markText: { color: "#FFFFFF", fontSize: 30, fontWeight: "900" },
  kicker: { color: "#4C7A3D", fontSize: 12, fontWeight: "900", letterSpacing: 2 },
  title: {
    color: "#1F2A1A",
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "900",
    marginTop: 8,
    textAlign: "center",
  },
  body: {
    maxWidth: 540,
    color: "#52624D",
    fontSize: 17,
    lineHeight: 26,
    marginTop: 14,
    textAlign: "center",
  },
  notice: {
    width: "100%",
    maxWidth: 540,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 20,
    marginTop: 28,
    borderWidth: 1,
    borderColor: "#DCE7D7",
  },
  noticeTitle: { color: "#2D3C28", fontSize: 16, fontWeight: "800" },
  noticeBody: { color: "#52624D", fontSize: 14, lineHeight: 21, marginTop: 7 },
});
