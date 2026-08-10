import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppButton } from "@/components/AppButton";
import { IconButton } from "@/components/IconButton";
import { ResultCard } from "@/components/ResultCard";
import { useI18n } from "@/i18n";
import type { ScanResult } from "@/types";
import { colors, shadows, spacing } from "@/theme";

export function ResultScreen({ route, navigation }: { route: any; navigation: any }) {
  const { t } = useI18n();
  const result = route.params.result as ScanResult;

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <IconButton
          name="close"
          accessibilityLabel={t("result.closeA11y")}
          onPress={() => navigation.goBack()}
          backgroundColor={colors.neutralSurface}
        />
        <Text style={styles.headerTitle}>{t("result.screenTitle")}</Text>
        <View style={styles.headerSpacer} />
      </View>
      <ResultCard result={result} />
      <View style={styles.footer}>
        <AppButton
          label={t("result.scanAnother")}
          icon="scan-outline"
          onPress={() => navigation.navigate("Scan", { screen: "Scan" })}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: { height: 62, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.lg, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle: { color: colors.ink, fontSize: 16, fontWeight: "900" },
  headerSpacer: { width: 48 },
  footer: { padding: spacing.lg, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border, ...shadows.card },
});
