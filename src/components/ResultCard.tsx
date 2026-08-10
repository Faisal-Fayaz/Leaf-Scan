import React from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { ScanResult, Severity } from "@/types";
import { humanizeLabel } from "@/lib/labels";

const SEVERITY_COLORS: Record<Severity, string> = {
  info: "#4C7A3D",
  moderate: "#C97F1E",
  urgent: "#B23A2F",
};

const SEVERITY_LABELS: Record<Severity, string> = {
  info: "Healthy / monitor",
  moderate: "Treat soon",
  urgent: "Needs prompt confirmation",
};

export function ResultCard({ result }: { result: ScanResult }) {
  const { imageUri, topPrediction, treatment, isLowConfidence, isAmbiguous } = result;
  const title = treatment?.displayName ?? humanizeLabel(topPrediction.label);
  const confidencePercent = Math.round(topPrediction.confidence * 100);

  return (
    <ScrollView style={styles.card} contentContainerStyle={styles.content}>
      <Image source={{ uri: imageUri }} style={styles.image} />

      <View style={styles.body}>
        <View style={styles.headerRow}>
          <View style={styles.titleBlock}>
            <Text style={styles.eyebrow}>{topPrediction.mode === "disease" ? "Disease model" : "Pest model"}</Text>
            <Text style={styles.title}>{title}</Text>
            {treatment?.crop && <Text style={styles.crop}>{treatment.crop}</Text>}
          </View>
          <View style={[styles.severityBadge, { backgroundColor: SEVERITY_COLORS[treatment?.severity ?? "moderate"] }]}>
            <Text style={styles.severityText}>{SEVERITY_LABELS[treatment?.severity ?? "moderate"]}</Text>
          </View>
        </View>

        <View style={styles.scorePanel}>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreLabel}>Model score</Text>
            <Text style={styles.scoreValue}>{confidencePercent}%</Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${Math.max(3, Math.min(100, confidencePercent))}%`, backgroundColor: isLowConfidence ? "#C97F1E" : "#4C7A3D" }]} />
          </View>
          <Text style={styles.scoreNote}>A model score is not a confirmed diagnosis.</Text>
        </View>

        {isLowConfidence && (
          <View style={styles.warningCard}>
            <Text style={styles.warningTitle}>{isAmbiguous ? "Two model results were too close" : "Not confident enough to diagnose"}</Text>
            <Text style={styles.warningText}>
              Take another photo of one affected leaf in daylight. Compare the result with the whole plant and confirm with a local agricultural expert before removing plants or applying any product.
            </Text>
          </View>
        )}

        {treatment?.description && <Text style={styles.description}>{treatment.description}</Text>}

        {treatment && treatment.organicTreatment.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Low-risk first steps</Text>
            {treatment.organicTreatment.map((step, index) => (
              <Text key={index} style={styles.stepText}>{"•"} {step}</Text>
            ))}
          </View>
        )}

        {treatment && treatment.chemicalTreatment.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitleMuted}>Chemical products</Text>
            {treatment.chemicalTreatment.map((step, index) => (
              <Text key={index} style={styles.stepTextMuted}>{"•"} {step}</Text>
            ))}
          </View>
        )}

        {!treatment && (
          <View style={styles.unsupportedCard}>
            <Text style={styles.unsupportedTitle}>No verified treatment card for this class</Text>
            <Text style={styles.noDataText}>
              This pest model currently exposes a numeric class label only. Do not choose a pesticide from this result alone; identify the insect locally first.
            </Text>
          </View>
        )}

        <Text style={styles.disclaimer}>
          LeafScan is decision support, not a replacement for a qualified agronomist or local product label. Never mix or apply a pesticide without following the label and local rules.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { paddingBottom: 26 },
  image: { width: "100%", height: 270, backgroundColor: "#E6EEE1" },
  body: { padding: 20 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  titleBlock: { flex: 1, paddingRight: 10 },
  eyebrow: { color: "#6B7A63", fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.8 },
  title: { fontSize: 24, lineHeight: 29, fontWeight: "800", color: "#1F2A1A", marginTop: 4 },
  crop: { fontSize: 14, color: "#6B7A63", marginTop: 4 },
  severityBadge: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 12, maxWidth: 125 },
  severityText: { color: "#FFFFFF", fontSize: 11, fontWeight: "800", textAlign: "center" },
  scorePanel: { marginTop: 18, padding: 14, borderRadius: 14, backgroundColor: "#F4F7F1" },
  scoreRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  scoreLabel: { fontSize: 13, color: "#52624D", fontWeight: "700" },
  scoreValue: { fontSize: 16, color: "#2D3C28", fontWeight: "800" },
  track: { height: 7, backgroundColor: "#D8E4D3", borderRadius: 4, overflow: "hidden", marginTop: 8 },
  fill: { height: "100%", borderRadius: 4 },
  scoreNote: { fontSize: 11, color: "#71816B", marginTop: 7 },
  warningCard: { marginTop: 16, padding: 15, borderRadius: 14, backgroundColor: "#FFF4E8", borderWidth: 1, borderColor: "#F2D0A8" },
  warningTitle: { color: "#8D4B20", fontSize: 16, fontWeight: "800" },
  warningText: { color: "#74482D", fontSize: 14, lineHeight: 20, marginTop: 6 },
  description: { fontSize: 15, color: "#3A4535", marginTop: 18, lineHeight: 22 },
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#1F2A1A", marginBottom: 8 },
  sectionTitleMuted: { fontSize: 14, fontWeight: "800", color: "#6D7569", marginBottom: 7 },
  stepText: { fontSize: 14, color: "#3A4535", lineHeight: 22, marginBottom: 3 },
  stepTextMuted: { fontSize: 13, color: "#7B8278", lineHeight: 20 },
  unsupportedCard: { marginTop: 18, padding: 15, borderRadius: 14, backgroundColor: "#F7F3E8" },
  unsupportedTitle: { color: "#5F603B", fontSize: 15, fontWeight: "800" },
  noDataText: { fontSize: 14, color: "#66684E", marginTop: 6, lineHeight: 20 },
  disclaimer: { fontSize: 12, color: "#7B8278", marginTop: 24, lineHeight: 18 },
});
