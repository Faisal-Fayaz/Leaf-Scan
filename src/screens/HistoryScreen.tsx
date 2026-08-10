import React from "react";
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
import { useNavigation } from "@react-navigation/native";
import { useScanHistory, ScanHistoryItem } from "@/hooks/useScanHistory";
import { getTreatment } from "@/data/treatments";
import { humanizeLabel } from "@/lib/labels";
import { hasAmbiguousMargin, isPredictionUncertain } from "@/lib/resultSafety";

export default function HistoryScreen() {
  const { history, loading, error, clearHistory, reloadHistory } = useScanHistory();
  const navigation = useNavigation() as any;

  const confirmClear = () => {
    Alert.alert(
      "Clear scan history?",
      "This removes saved scan summaries and their copied images from this device. It cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => {
            void clearHistory().catch(() => {
              Alert.alert("History was not cleared", "Please try again.");
            });
          },
        },
      ]
    );
  };

  const openHistoryItem = (item: ScanHistoryItem) => {
    if (!item.result) return;
    const prediction = item.result.topPrediction;
    const refreshedResult = {
      ...item.result,
      treatment: prediction.mode === "disease" ? getTreatment(prediction.classId) : null,
      isLowConfidence: isPredictionUncertain(prediction),
      isAmbiguous: hasAmbiguousMargin(prediction),
    };
    const parentNavigation = navigation.getParent?.() ?? navigation;
    parentNavigation.navigate("Result", { result: refreshedResult });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4C7A3D" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Scan history</Text>
          <Text style={styles.subtitle}>Saved only on this device</Text>
        </View>
        {history.length > 0 && (
          <Pressable onPress={confirmClear} hitSlop={10}>
            <Text style={styles.clear}>Clear all</Text>
          </Pressable>
        )}
      </View>

      {error && (
        <View style={styles.errorCard}>
          <View style={styles.errorBody}>
            <Text style={styles.errorTitle}>History is unavailable</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
          <Pressable onPress={() => void reloadHistory()} hitSlop={8}>
            <Text style={styles.retry}>Retry</Text>
          </Pressable>
        </View>
      )}

      {history.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyIcon}>◌</Text>
          <Text style={styles.emptyTitle}>No scans yet</Text>
          <Text style={styles.emptyText}>Your recent scan results will appear here.</Text>
          <Pressable style={styles.primaryButton} onPress={() => navigation.navigate("Scan")}>
            <Text style={styles.primaryButtonText}>Start a scan</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <HistoryRow item={item} onPress={() => openHistoryItem(item)} />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

function HistoryRow({ item, onPress }: { item: ScanHistoryItem; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.item,
        pressed && item.result ? styles.itemPressed : undefined,
        !item.result ? styles.itemUnavailable : undefined,
      ]}
      onPress={onPress}
      disabled={!item.result}
      accessibilityRole={item.result ? "button" : undefined}
      accessibilityLabel={item.result ? `Review ${item.diagnosis}` : undefined}
    >
      {item.imageUri ? (
        <Image source={{ uri: item.imageUri }} style={styles.thumbnail} />
      ) : (
        <View style={styles.thumbnailPlaceholder} />
      )}
      <View style={styles.itemBody}>
        <Text style={styles.diagnosis} numberOfLines={2}>
          {item.diagnosis.includes("___") ? humanizeLabel(item.diagnosis) : item.diagnosis}
        </Text>
        <Text style={styles.meta}>
          {Math.round(item.confidence * 100)}% model score · {item.type}
        </Text>
        {item.isAmbiguous && <Text style={styles.warning}>Needs confirmation</Text>}
        <Text style={styles.date}>{new Date(item.timestamp).toLocaleString()}</Text>
        {item.crop && <Text style={styles.crop}>{item.crop}</Text>}
        {item.result && <Text style={styles.review}>Tap to review</Text>}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 18, paddingTop: 20, backgroundColor: "#F4F7F1" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  title: { fontSize: 28, fontWeight: "800", color: "#1F2A1A" },
  subtitle: { fontSize: 13, color: "#6B7A63", marginTop: 4 },
  clear: { color: "#9A3E2F", fontWeight: "800", paddingTop: 7 },
  errorCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF3EC", borderRadius: 14, padding: 13, marginBottom: 14 },
  errorBody: { flex: 1, paddingRight: 10 },
  errorTitle: { color: "#873B25", fontWeight: "800" },
  errorText: { color: "#873B25", fontSize: 12, lineHeight: 17, marginTop: 2 },
  retry: { color: "#873B25", fontWeight: "900" },
  listContent: { paddingBottom: 24 },
  item: { flexDirection: "row", backgroundColor: "#FFFFFF", padding: 12, borderRadius: 16 },
  itemPressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
  itemUnavailable: { opacity: 0.82 },
  thumbnail: { width: 74, height: 74, borderRadius: 12, backgroundColor: "#E6EEE1" },
  thumbnailPlaceholder: { width: 74, height: 74, borderRadius: 12, backgroundColor: "#E6EEE1" },
  itemBody: { flex: 1, marginLeft: 12, justifyContent: "center" },
  diagnosis: { fontSize: 17, fontWeight: "800", color: "#2D3C28" },
  meta: { fontSize: 13, color: "#587052", marginTop: 4 },
  warning: { fontSize: 12, color: "#A35A1E", fontWeight: "700", marginTop: 3 },
  date: { fontSize: 11, color: "#7C8977", marginTop: 5 },
  crop: { fontSize: 12, color: "#6B7A63", marginTop: 2 },
  review: { fontSize: 12, color: "#4C7A3D", fontWeight: "800", marginTop: 5 },
  separator: { height: 10 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 28 },
  emptyIcon: { fontSize: 48, color: "#8CA883" },
  emptyTitle: { fontSize: 21, fontWeight: "800", color: "#2D3C28", marginTop: 8 },
  emptyText: { fontSize: 15, color: "#6B7A63", textAlign: "center", marginTop: 7 },
  primaryButton: { marginTop: 20, backgroundColor: "#4C7A3D", paddingHorizontal: 22, paddingVertical: 13, borderRadius: 13 },
  primaryButtonText: { color: "#FFFFFF", fontWeight: "800" },
});
