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
import { humanizeLabel } from "@/lib/labels";

export default function HistoryScreen() {
  const { history, loading, clearHistory } = useScanHistory();
  const navigation = useNavigation() as any;

  const confirmClear = () => {
    Alert.alert(
      "Clear scan history?",
      "This removes saved scan summaries from this device. It cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Clear", style: "destructive", onPress: () => void clearHistory() },
      ]
    );
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
          renderItem={({ item }) => <HistoryRow item={item} />}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

function HistoryRow({ item }: { item: ScanHistoryItem }) {
  return (
    <View style={styles.item}>
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 18, paddingTop: 20, backgroundColor: "#F4F7F1" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  title: { fontSize: 28, fontWeight: "800", color: "#1F2A1A" },
  subtitle: { fontSize: 13, color: "#6B7A63", marginTop: 4 },
  clear: { color: "#9A3E2F", fontWeight: "800", paddingTop: 7 },
  listContent: { paddingBottom: 24 },
  item: { flexDirection: "row", backgroundColor: "#FFFFFF", padding: 12, borderRadius: 16 },
  thumbnail: { width: 74, height: 74, borderRadius: 12, backgroundColor: "#E6EEE1" },
  thumbnailPlaceholder: { width: 74, height: 74, borderRadius: 12, backgroundColor: "#E6EEE1" },
  itemBody: { flex: 1, marginLeft: 12, justifyContent: "center" },
  diagnosis: { fontSize: 17, fontWeight: "800", color: "#2D3C28" },
  meta: { fontSize: 13, color: "#587052", marginTop: 4 },
  warning: { fontSize: 12, color: "#A35A1E", fontWeight: "700", marginTop: 3 },
  date: { fontSize: 11, color: "#7C8977", marginTop: 5 },
  crop: { fontSize: 12, color: "#6B7A63", marginTop: 2 },
  separator: { height: 10 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 28 },
  emptyIcon: { fontSize: 48, color: "#8CA883" },
  emptyTitle: { fontSize: 21, fontWeight: "800", color: "#2D3C28", marginTop: 8 },
  emptyText: { fontSize: 15, color: "#6B7A63", textAlign: "center", marginTop: 7 },
  primaryButton: { marginTop: 20, backgroundColor: "#4C7A3D", paddingHorizontal: 22, paddingVertical: 13, borderRadius: 13 },
  primaryButtonText: { color: "#FFFFFF", fontWeight: "800" },
});
