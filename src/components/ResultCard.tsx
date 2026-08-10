import React, { type ComponentProps } from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import type { ScanResult, Severity } from "@/types";
import { humanizeLabel } from "@/lib/labels";
import { getResultSafetyStatus } from "@/lib/resultSafety";
import { useI18n } from "@/i18n";
import { colors, radii, shadows, spacing } from "@/theme";

const SEVERITY_COLORS: Record<Severity, string> = {
  info: colors.primary,
  moderate: colors.warning,
  urgent: colors.danger,
};

export function ResultCard({ result }: { result: ScanResult }) {
  const { language, t } = useI18n();
  const { imageUri, topPrediction, treatment, isAmbiguous } = result;
  const safetyStatus = getResultSafetyStatus(result);
  const canShowGuidance = safetyStatus === "possible-match" && treatment !== null;
  const possibleName = treatment?.displayName ?? humanizeLabel(topPrediction.label);
  const title =
    safetyStatus === "possible-match"
      ? t("result.possibleTitle", { name: possibleName })
      : safetyStatus === "uncertain"
        ? t("result.uncertainTitle")
        : t("result.unsupportedTitle");
  const confidencePercent = Math.round(topPrediction.confidence * 100);
  const severityLabel = canShowGuidance
    ? treatment.severity === "info"
      ? t("result.monitor")
      : treatment.severity === "moderate"
        ? t("result.confirmSoon")
        : t("result.confirmPromptly")
    : safetyStatus === "uncertain"
      ? t("result.retake")
      : t("result.unavailable");
  const statusColor = canShowGuidance
    ? SEVERITY_COLORS[treatment.severity]
    : safetyStatus === "uncertain"
      ? colors.warning
      : colors.muted;
  const statusIcon: ComponentProps<typeof Ionicons>["name"] =
    safetyStatus === "possible-match"
      ? "leaf"
      : safetyStatus === "uncertain"
        ? "alert-circle"
        : "help-circle";

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <Image
          source={{ uri: imageUri }}
          style={styles.image}
          resizeMode="cover"
          accessible
          accessibilityLabel={t("result.imageA11y", { name: title })}
        />
        <LinearGradient
          colors={["transparent", "rgba(8,19,12,0.62)"]}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.heroBadge, { backgroundColor: statusColor }]}>
          <Ionicons name={statusIcon} size={16} color={colors.white} />
          <Text style={styles.heroBadgeText}>{severityLabel}</Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.eyebrow}>
          {safetyStatus === "possible-match"
            ? t("result.possibleEyebrow")
            : t("result.confirmEyebrow")}
        </Text>
        <Text style={styles.title}>{title}</Text>
        {canShowGuidance && treatment.crop && (
          <View style={styles.cropLine}>
            <Ionicons name="nutrition-outline" size={16} color={colors.primary} />
            <Text style={styles.crop}>{treatment.crop}</Text>
          </View>
        )}

        <View style={styles.scorePanel}>
          <View style={styles.scoreTop}>
            <View>
              <Text style={styles.scoreLabel}>{t("result.modelScore")}</Text>
              <Text style={styles.scoreNote}>{t("result.scoreNote")}</Text>
            </View>
            <Text style={[styles.scoreValue, { color: statusColor }]}>{confidencePercent}%</Text>
          </View>
          <View
            style={styles.track}
            accessibilityRole="progressbar"
            accessibilityValue={{ min: 0, max: 100, now: confidencePercent }}
          >
            <View
              style={[
                styles.fill,
                {
                  width: `${Math.max(3, Math.min(100, confidencePercent))}%`,
                  backgroundColor: statusColor,
                },
              ]}
            />
          </View>
          {!canShowGuidance && (
            <Text style={styles.closestMatch}>
              {t("result.closest", { name: humanizeLabel(topPrediction.label) })}
            </Text>
          )}
        </View>

        {safetyStatus === "uncertain" && (
          <Callout
            icon="camera-outline"
            title={isAmbiguous ? t("result.ambiguousTitle") : t("result.lowTitle")}
            body={t("result.warningBody")}
            tone="warning"
          />
        )}

        {language === "hi" && canShowGuidance && (
          <Callout
            icon="language-outline"
            title={t("about.languageTitle")}
            body={t("result.guidanceEnglish")}
            tone="neutral"
          />
        )}

        {canShowGuidance && treatment.description && (
          <Text style={styles.description}>{treatment.description}</Text>
        )}

        {canShowGuidance && treatment.organicTreatment.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
              </View>
              <Text style={styles.sectionTitle}>{t("result.firstSteps")}</Text>
            </View>
            <View style={styles.stepsCard}>
              {treatment.organicTreatment.map((step, index) => (
                <View key={`${step}-${index}`} style={[styles.step, index > 0 ? styles.stepBorder : undefined]}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {canShowGuidance && treatment.chemicalTreatment.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, styles.chemicalIcon]}>
                <Ionicons name="flask-outline" size={20} color={colors.muted} />
              </View>
              <Text style={styles.sectionTitleMuted}>{t("result.chemical")}</Text>
            </View>
            {treatment.chemicalTreatment.map((step, index) => (
              <Text key={`${step}-${index}`} style={styles.stepTextMuted}>• {step}</Text>
            ))}
          </View>
        )}

        {safetyStatus === "unsupported" && (
          <Callout
            icon="ban-outline"
            title={t("result.unsupportedCardTitle")}
            body={t("result.unsupportedBody")}
            tone="neutral"
          />
        )}

        <View style={styles.disclaimerCard}>
          <Ionicons name="information-circle-outline" size={20} color={colors.muted} />
          <Text style={styles.disclaimer}>{t("result.disclaimer")}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

function Callout({
  icon,
  title,
  body,
  tone,
}: {
  icon: ComponentProps<typeof Ionicons>["name"];
  title: string;
  body: string;
  tone: "warning" | "neutral";
}) {
  const warning = tone === "warning";
  return (
    <View
      style={[
        styles.callout,
        {
          backgroundColor: warning ? colors.warningSurface : colors.neutralSurface,
          borderColor: warning ? colors.warningBorder : colors.border,
        },
      ]}
    >
      <View style={styles.calloutHeader}>
        <Ionicons name={icon} size={21} color={warning ? colors.warning : colors.inkSoft} />
        <Text style={[styles.calloutTitle, { color: warning ? colors.warning : colors.inkSoft }]}>{title}</Text>
      </View>
      <Text style={[styles.calloutBody, { color: warning ? "#75491F" : colors.muted }]}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.canvas },
  content: { paddingBottom: spacing.xxxl },
  hero: { height: 300, backgroundColor: colors.surfaceTint },
  image: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
  heroBadge: { position: "absolute", left: spacing.xl, bottom: spacing.xxxl, minHeight: 36, borderRadius: radii.pill, paddingHorizontal: spacing.md, flexDirection: "row", alignItems: "center", gap: 7 },
  heroBadgeText: { color: colors.white, fontSize: 12, fontWeight: "900" },
  body: { marginTop: -20, borderTopLeftRadius: 26, borderTopRightRadius: 26, backgroundColor: colors.canvas, paddingHorizontal: spacing.xl, paddingTop: spacing.xxl },
  eyebrow: { color: colors.primary, fontSize: 11, lineHeight: 15, fontWeight: "900", letterSpacing: 1.2 },
  title: { color: colors.ink, fontSize: 29, lineHeight: 35, fontWeight: "900", marginTop: 5 },
  cropLine: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: spacing.sm },
  crop: { color: colors.muted, fontSize: 14, fontWeight: "700" },
  scorePanel: { marginTop: spacing.xl, padding: spacing.lg, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, ...shadows.card },
  scoreTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: spacing.md },
  scoreLabel: { color: colors.ink, fontSize: 14, fontWeight: "900" },
  scoreValue: { fontSize: 25, lineHeight: 29, fontWeight: "900" },
  track: { height: 9, backgroundColor: colors.primaryLight, borderRadius: radii.pill, overflow: "hidden", marginTop: spacing.md },
  fill: { height: "100%", borderRadius: radii.pill },
  scoreNote: { color: colors.subtle, fontSize: 11, marginTop: 3 },
  closestMatch: { color: "#75491F", fontSize: 12, lineHeight: 18, marginTop: spacing.md },
  callout: { marginTop: spacing.lg, padding: spacing.lg, borderRadius: radii.lg, borderWidth: 1 },
  calloutHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  calloutTitle: { flex: 1, fontSize: 16, lineHeight: 21, fontWeight: "900" },
  calloutBody: { fontSize: 14, lineHeight: 21, marginTop: spacing.sm },
  description: { color: colors.inkSoft, fontSize: 15, lineHeight: 23, marginTop: spacing.xl },
  section: { marginTop: spacing.xxl },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.md },
  sectionIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: colors.primaryLight },
  chemicalIcon: { backgroundColor: colors.neutralSurface },
  sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: "900" },
  sectionTitleMuted: { color: colors.inkSoft, fontSize: 16, fontWeight: "900" },
  stepsCard: { backgroundColor: colors.surface, borderRadius: radii.lg, paddingHorizontal: spacing.lg, borderWidth: 1, borderColor: colors.border, ...shadows.card },
  step: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md, paddingVertical: spacing.lg },
  stepBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  stepNumber: { width: 27, height: 27, borderRadius: 9, alignItems: "center", justifyContent: "center", backgroundColor: colors.primaryLight },
  stepNumberText: { color: colors.primaryDark, fontSize: 12, fontWeight: "900" },
  stepText: { flex: 1, color: colors.inkSoft, fontSize: 14, lineHeight: 21 },
  stepTextMuted: { color: colors.muted, fontSize: 13, lineHeight: 20, marginBottom: 5 },
  disclaimerCard: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, marginTop: spacing.xxl, padding: spacing.lg, borderRadius: radii.lg, backgroundColor: colors.neutralSurface },
  disclaimer: { flex: 1, color: colors.muted, fontSize: 12, lineHeight: 18 },
});
