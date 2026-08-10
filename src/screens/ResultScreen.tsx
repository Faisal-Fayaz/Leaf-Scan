import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ResultCard } from "@/components/ResultCard";
import { ScanResult } from "@/types";

export function ResultScreen({ route, navigation }: { route: any; navigation: any }) {
  const result = route.params.result as ScanResult;

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ResultCard result={result} />
      <View style={styles.footer}>
        <TouchableOpacity style={styles.rescanButton} onPress={() => navigation.goBack()}>
          <Text style={styles.rescanText}>Scan another</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: "#EDEDED" },
  rescanButton: {
    backgroundColor: "#4C7A3D",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  rescanText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
});
