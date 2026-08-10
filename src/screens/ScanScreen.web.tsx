import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { StatusPill } from "@/components/StatusPill";
import { useI18n } from "@/i18n";
import { colors, radii, shadows, spacing } from "@/theme";

/** Native camera and TensorFlow Lite modules are intentionally excluded from web. */
export function ScanScreen() {
  const { t } = useI18n();
  return (
    <LinearGradient colors={[colors.canvas, "#E4F0E1"]} style={styles.container}>
      <View style={styles.card}>
        <View style={styles.mark} accessibilityElementsHidden>
          <Ionicons name="scan-outline" size={32} color={colors.primaryDark} />
        </View>
        <StatusPill label={t("web.kicker")} icon="phone-portrait-outline" />
        <Text style={styles.title}>{t("web.title")}</Text>
        <Text style={styles.body}>{t("web.body")}</Text>
        <View style={styles.notice} accessibilityRole="text">
          <View style={styles.noticeIcon}>
            <Ionicons name="information-circle-outline" size={23} color={colors.primary} />
          </View>
          <View style={styles.noticeCopy}>
            <Text style={styles.noticeTitle}>{t("web.noticeTitle")}</Text>
            <Text style={styles.noticeBody}>{t("web.noticeBody")}</Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xxl },
  card: { width: "100%", maxWidth: 620, alignItems: "center", backgroundColor: colors.surface, borderRadius: 28, padding: 40, borderWidth: 1, borderColor: colors.border, ...shadows.floating },
  mark: { width: 72, height: 72, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: colors.lime, marginBottom: spacing.xl },
  title: { color: colors.ink, fontSize: 36, lineHeight: 43, fontWeight: "900", marginTop: spacing.lg, textAlign: "center" },
  body: { maxWidth: 520, color: colors.muted, fontSize: 17, lineHeight: 27, marginTop: spacing.md, textAlign: "center" },
  notice: { width: "100%", flexDirection: "row", alignItems: "flex-start", backgroundColor: colors.surfaceTint, borderRadius: radii.lg, padding: spacing.lg, marginTop: spacing.xxl, borderWidth: 1, borderColor: colors.border },
  noticeIcon: { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface },
  noticeCopy: { flex: 1, marginLeft: spacing.md },
  noticeTitle: { color: colors.ink, fontSize: 16, fontWeight: "900" },
  noticeBody: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: 5 },
});
