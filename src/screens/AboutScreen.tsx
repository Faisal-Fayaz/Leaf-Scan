import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import diseaseClassNames from "@/data/disease_class_names.json";
import pestClassNames from "@/data/pest_class_names.json";

export default function AboutScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.kicker}>LEAFSCAN</Text>
      <Text style={styles.title}>A careful second opinion for the field</Text>
      <Text style={styles.lead}>
        LeafScan runs its current models on-device, so a scan does not require an internet connection or upload your photos.
      </Text>

      <InfoCard title="What this version can identify">
        <Text style={styles.text}>
          The bundled disease model has {diseaseClassNames.length} PlantVillage-style classes. The pest model has {pestClassNames.length} IP102-style insect classes, but those pest labels are currently numeric and require local confirmation.
        </Text>
      </InfoCard>

      <InfoCard title="Use it safely">
        <Text style={styles.text}>
          A photo classifier can confuse disease, pests, nutrient stress, weather damage, and normal variation. Use clear photos of one leaf, take a second scan when the score is low, and confirm serious or spreading problems with a local extension officer or agronomist.
        </Text>
      </InfoCard>

      <InfoCard title="Why it is not yet an any-plant expert">
        <Text style={styles.text}>
          No single model can reliably identify every plant species and disease from one image. Broad coverage requires region-specific datasets, verified labels, calibration on field images, and ongoing evaluation. Until those are added, LeafScan intentionally refuses to present unsupported results as facts.
        </Text>
      </InfoCard>

      <InfoCard title="Privacy">
        <Text style={styles.text}>
          Images and scan summaries are stored locally by this app. You can clear scan history from the History tab. No server account is required.
        </Text>
      </InfoCard>

      <View style={styles.footer}>
        <Text style={styles.version}>LeafScan v1.0.0</Text>
        <Text style={styles.disclaimer}>AI-assisted decision support • not a pesticide label or professional diagnosis</Text>
      </View>
    </ScrollView>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 22, backgroundColor: "#F4F7F1" },
  kicker: { color: "#4C7A3D", fontSize: 12, fontWeight: "900", letterSpacing: 2 },
  title: { fontSize: 30, lineHeight: 35, fontWeight: "900", color: "#1F2A1A", marginTop: 8 },
  lead: { fontSize: 16, lineHeight: 24, color: "#52624D", marginTop: 14, marginBottom: 8 },
  card: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, marginTop: 14 },
  heading: { fontSize: 17, fontWeight: "800", color: "#2D3C28", marginBottom: 7 },
  text: { fontSize: 14, lineHeight: 21, color: "#52624D" },
  footer: { alignItems: "center", marginTop: 28, paddingBottom: 10 },
  version: { color: "#6B7A63", fontWeight: "800" },
  disclaimer: { color: "#7B8278", fontSize: 11, textAlign: "center", marginTop: 6 },
});
