import React, { useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { AppButton } from "@/components/AppButton";
import { StatusPill } from "@/components/StatusPill";
import { useScanHistory, type ScanHistoryItem } from "@/hooks/useScanHistory";
import { useI18n } from "@/i18n";
import { getTreatment } from "@/data/treatments";
import { humanizeLabel } from "@/lib/labels";
import {
  getResultSafetyStatus,
  hasAmbiguousMargin,
  isPredictionUncertain,
} from "@/lib/resultSafety";
import type { ScanResult } from "@/types";
import { colors, radii, shadows, spacing } from "@/theme";

function currentResult(item: ScanHistoryItem): ScanResult | undefined {
  if (!item.result) return undefined;
  const prediction = item.result.topPrediction;
  return {
    ...item.result,
    treatment: prediction.mode === "disease" ? getTreatment(prediction.classId) : null,
    isLowConfidence: isPredictionUncertain(prediction),
    isAmbiguous: hasAmbiguousMargin(prediction),
  };
}

export default function HistoryScreen() {
  const { t } = useI18n();
  const { history, loading, error, clearHistory, reloadHistory } = useScanHistory();
  const navigation = useNavigation() as any;

  const confirmClear = () => {
    Alert.alert(t("history.clearTitle"), t("history.clearBody"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.clear"),
        style: "destructive",
        onPress: () => {
          void clearHistory().catch(() => {
            Alert.alert(t("history.clearErrorTitle"), t("history.clearErrorBody"));
          });
        },
      },
    ]);
  };

  const openHistoryItem = (item: ScanHistoryItem) => {
    const result = currentResult(item);
    if (!result) return;
    const parentNavigation = navigation.getParent?.() ?? navigation;
    parentNavigation.navigate("Result", { result });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <StatusPill label={t("common.offline")} icon="cloud-offline-outline" />
          <Text style={styles.title}>{t("history.title")}</Text>
          <Text style={styles.subtitle}>{t("history.subtitle")}</Text>
        </View>
        {history.length > 0 && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("history.clearAll")}
            hitSlop={8}
            onPress={confirmClear}
            style={({ pressed }) => [styles.clearButton, pressed ? styles.pressed : undefined]}
          >
            <Ionicons name="trash-outline" size={18} color={colors.danger} />
            <Text style={styles.clearText}>{t("history.clearAll")}</Text>
          </Pressable>
        )}
      </View>

      {history.length > 0 && (
        <Text style={styles.count}>{t("history.count", { count: history.length })}</Text>
      )}

      {error && (
        <View style={styles.errorCard} accessibilityRole="alert">
          <View style={styles.errorIcon}>
            <Ionicons name="alert-circle" size={22} color={colors.danger} />
          </View>
          <View style={styles.errorBody}>
            <Text style={styles.errorTitle}>{t("history.unavailableTitle")}</Text>
            <Text style={styles.errorText}>{t("history.unavailableBody")}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => void reloadHistory()}
            hitSlop={8}
          >
            <Text style={styles.retry}>{t("common.retry")}</Text>
          </Pressable>
        </View>
      )}

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          contentContainerStyle={history.length === 0 ? styles.emptyList : styles.listContent}
          renderItem={({ item }) => (
            <HistoryRow item={item} onPress={() => openHistoryItem(item)} />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <EmptyHistory onStart={() => navigation.navigate("Scan")} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

function EmptyHistory({ onStart }: { onStart: () => void }) {
  const { t } = useI18n();
  return (
    <View style={styles.emptyCard}>
      <LinearGradient colors={["#E6F2E2", "#F7FAF5"]} style={styles.emptyIllustration}>
        <Ionicons name="leaf-outline" size={46} color={colors.primary} />
        <View style={styles.emptyScanLine} />
      </LinearGradient>
      <Text style={styles.emptyTitle}>{t("history.emptyTitle")}</Text>
      <Text style={styles.emptyText}>{t("history.emptyBody")}</Text>
      <AppButton
        label={t("history.startScan")}
        icon="scan-outline"
        onPress={onStart}
        style={styles.emptyButton}
      />
    </View>
  );
}

function HistoryRow({ item, onPress }: { item: ScanHistoryItem; onPress: () => void }) {
  const { t, formatDate } = useI18n();
  const result = useMemo(() => currentResult(item), [item]);
  const safetyStatus = result ? getResultSafetyStatus(result) : "unsupported";
  const canReview = result !== undefined;
  const possibleName = result
    ? result.treatment?.displayName ?? humanizeLabel(result.topPrediction.label)
    : item.diagnosis;
  const diagnosis = result
    ? safetyStatus === "possible-match"
      ? t("result.possibleTitle", { name: possibleName })
      : safetyStatus === "uncertain"
        ? t("result.uncertainTitle")
        : t("result.unsupportedTitle")
    : item.diagnosis;
  const typeLabel =
    item.type === "disease"
      ? t("history.typeDisease")
      : item.type === "pest"
        ? t("history.typePest")
        : t("history.typeUnknown");

  return (
    <Pressable
      style={({ pressed }) => [
        styles.item,
        pressed && canReview ? styles.itemPressed : undefined,
        !canReview ? styles.itemUnavailable : undefined,
      ]}
      onPress={onPress}
      disabled={!canReview}
      accessibilityRole={canReview ? "button" : undefined}
      accessibilityLabel={canReview ? t("history.reviewA11y", { diagnosis }) : undefined}
    >
      {item.imageUri ? (
        <Image source={{ uri: item.imageUri }} style={styles.thumbnail} />
      ) : (
        <View style={styles.thumbnailPlaceholder}>
          <Ionicons name="leaf-outline" size={28} color={colors.primary} />
        </View>
      )}
      <View style={styles.itemBody}>
        <View style={styles.itemTopLine}>
          <Text style={styles.typeLabel}>{typeLabel}</Text>
          <Ionicons name="chevron-forward" size={17} color={colors.subtle} />
        </View>
        <Text style={styles.diagnosis} numberOfLines={2}>{diagnosis}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>{t("history.score", { score: Math.round(item.confidence * 100) })}</Text>
          {safetyStatus !== "possible-match" && (
            <StatusPill
              label={t("history.needsConfirmation")}
              icon="alert-circle-outline"
              tone="warning"
              style={styles.warningPill}
            />
          )}
        </View>
        <Text style={styles.date}>{formatDate(item.timestamp)}</Text>
        {canReview && (
          <View style={styles.reviewLine}>
            <Text style={styles.review}>{t("history.review")}</Text>
            <Ionicons name="arrow-forward" size={14} color={colors.primary} />
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.canvas },
  header: { flexDirection: "row", alignItems: "flex-start", paddingHorizontal: spacing.xl, paddingTop: spacing.lg, gap: spacing.md },
  headerCopy: { flex: 1 },
  title: { color: colors.ink, fontSize: 32, lineHeight: 38, fontWeight: "900", marginTop: spacing.md },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: 2 },
  clearButton: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: spacing.md, borderRadius: radii.md, backgroundColor: colors.dangerSurface },
  clearText: { color: colors.danger, fontSize: 12, fontWeight: "800" },
  pressed: { opacity: 0.74, transform: [{ scale: 0.98 }] },
  count: { color: colors.primary, fontSize: 12, fontWeight: "800", marginHorizontal: spacing.xl, marginTop: spacing.lg },
  errorCard: { flexDirection: "row", alignItems: "center", backgroundColor: colors.dangerSurface, borderRadius: radii.lg, padding: spacing.md, marginHorizontal: spacing.xl, marginTop: spacing.lg },
  errorIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  errorBody: { flex: 1, paddingHorizontal: spacing.md },
  errorTitle: { color: colors.danger, fontWeight: "900" },
  errorText: { color: colors.danger, fontSize: 12, lineHeight: 17, marginTop: 2 },
  retry: { color: colors.danger, fontWeight: "900" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  listContent: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.xxl },
  emptyList: { flexGrow: 1, padding: spacing.xl },
  emptyCard: { flex: 1, minHeight: 430, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface, borderRadius: radii.xl, padding: spacing.xxl, marginTop: spacing.xl, ...shadows.card },
  emptyIllustration: { width: 112, height: 112, borderRadius: 38, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  emptyScanLine: { position: "absolute", width: 78, height: 2, backgroundColor: colors.lime, opacity: 0.8 },
  emptyTitle: { color: colors.ink, fontSize: 23, lineHeight: 29, fontWeight: "900", textAlign: "center", marginTop: spacing.xxl },
  emptyText: { color: colors.muted, fontSize: 15, lineHeight: 22, textAlign: "center", marginTop: spacing.sm, maxWidth: 320 },
  emptyButton: { width: "100%", marginTop: spacing.xxl },
  separator: { height: spacing.md },
  item: { flexDirection: "row", backgroundColor: colors.surface, padding: spacing.md, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, ...shadows.card },
  itemPressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  itemUnavailable: { opacity: 0.76 },
  thumbnail: { width: 92, height: 112, borderRadius: radii.md, backgroundColor: colors.surfaceTint },
  thumbnailPlaceholder: { width: 92, height: 112, borderRadius: radii.md, backgroundColor: colors.surfaceTint, alignItems: "center", justifyContent: "center" },
  itemBody: { flex: 1, marginLeft: spacing.md, minHeight: 112 },
  itemTopLine: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  typeLabel: { color: colors.primary, fontSize: 10, fontWeight: "900", letterSpacing: 0.8, textTransform: "uppercase" },
  diagnosis: { color: colors.ink, fontSize: 17, lineHeight: 21, fontWeight: "900", marginTop: 4 },
  metaRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6, marginTop: 6 },
  meta: { color: colors.muted, fontSize: 11, fontWeight: "600" },
  warningPill: { minHeight: 24, paddingHorizontal: 8 },
  date: { color: colors.subtle, fontSize: 11, marginTop: 5 },
  reviewLine: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: "auto", paddingTop: 6 },
  review: { color: colors.primary, fontSize: 12, fontWeight: "900" },
});
