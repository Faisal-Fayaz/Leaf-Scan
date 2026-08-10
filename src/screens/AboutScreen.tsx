import React, { type ComponentProps } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusPill } from "@/components/StatusPill";
import diseaseClassNames from "@/data/disease_class_names.json";
import { useI18n, type AppLanguage } from "@/i18n";
import { colors, radii, shadows, spacing } from "@/theme";

export default function AboutScreen() {
  const { language, setLanguage, t } = useI18n();

  const chooseLanguage = (next: AppLanguage) => {
    if (next === language) return;
    if (Platform.OS !== "web") void Haptics.selectionAsync();
    setLanguage(next);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[colors.primaryDark, "#315D3D"]} style={styles.hero}>
          <View style={styles.heroGlow} />
          <View style={styles.heroTop}>
            <StatusPill label={t("about.kicker")} icon="leaf" tone="dark" />
            <View style={styles.heroMark}>
              <Ionicons name="scan-outline" size={25} color={colors.primaryDark} />
            </View>
          </View>
          <Text style={styles.heroTitle}>{t("about.title")}</Text>
          <Text style={styles.heroLead}>{t("about.lead")}</Text>

          <View style={styles.stats}>
            <Stat icon="layers-outline" label={t("about.statClasses", { count: diseaseClassNames.length })} />
            <Stat icon="cloud-offline-outline" label={t("about.statOffline")} />
            <Stat icon="lock-closed-outline" label={t("about.statPrivate")} />
          </View>
        </LinearGradient>

        <View style={styles.languageCard}>
          <View style={styles.cardIcon}>
            <Ionicons name="language-outline" size={22} color={colors.primary} />
          </View>
          <View style={styles.languageCopy}>
            <Text style={styles.cardTitle}>{t("about.languageTitle")}</Text>
            <Text style={styles.cardText}>{t("about.languageBody")}</Text>
          </View>
          <View style={styles.segmented}>
            <LanguageOption
              label={t("about.english")}
              active={language === "en"}
              onPress={() => chooseLanguage("en")}
            />
            <LanguageOption
              label={t("about.hindi")}
              active={language === "hi"}
              onPress={() => chooseLanguage("hi")}
            />
          </View>
        </View>

        <InfoCard icon="layers-outline" title={t("about.modelTitle")}>
          {t("about.modelBody", { count: diseaseClassNames.length })}
        </InfoCard>
        <InfoCard icon="shield-checkmark-outline" title={t("about.safeTitle")} tone="warning">
          {t("about.safeBody")}
        </InfoCard>
        <InfoCard icon="earth-outline" title={t("about.scopeTitle")}>
          {t("about.scopeBody")}
        </InfoCard>
        <InfoCard icon="lock-closed-outline" title={t("about.privacyTitle")}>
          {t("about.privacyBody")}
        </InfoCard>

        {language === "hi" && (
          <View style={styles.languageNote}>
            <Ionicons name="information-circle-outline" size={21} color={colors.warning} />
            <Text style={styles.languageNoteText}>{t("about.guidanceEnglish")}</Text>
          </View>
        )}

        <View style={styles.footer}>
          <View style={styles.footerMark}>
            <Ionicons name="leaf" size={20} color={colors.white} />
          </View>
          <Text style={styles.version}>{t("about.version")}</Text>
          <Text style={styles.disclaimer}>{t("about.disclaimer")}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ icon, label }: { icon: ComponentProps<typeof Ionicons>["name"]; label: string }) {
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={17} color={colors.lime} />
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function LanguageOption({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.languageOption,
        active ? styles.languageOptionActive : undefined,
        pressed ? styles.pressed : undefined,
      ]}
    >
      {active && <Ionicons name="checkmark-circle" size={17} color={colors.primary} />}
      <Text style={[styles.languageLabel, active ? styles.languageLabelActive : undefined]}>{label}</Text>
    </Pressable>
  );
}

function InfoCard({
  icon,
  title,
  tone = "green",
  children,
}: {
  icon: ComponentProps<typeof Ionicons>["name"];
  title: string;
  tone?: "green" | "warning";
  children: string;
}) {
  const iconColor = tone === "warning" ? colors.warning : colors.primary;
  const iconBackground = tone === "warning" ? colors.warningSurface : colors.primaryLight;
  return (
    <View style={styles.infoCard}>
      <View style={[styles.cardIcon, { backgroundColor: iconBackground }]}>
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
      <View style={styles.infoBody}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardText}>{children}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  hero: { borderRadius: 28, padding: spacing.xxl, overflow: "hidden", ...shadows.floating },
  heroGlow: { position: "absolute", width: 220, height: 220, borderRadius: 110, right: -90, top: -90, backgroundColor: "rgba(154,203,119,0.16)" },
  heroTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  heroMark: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: colors.lime },
  heroTitle: { color: colors.white, fontSize: 31, lineHeight: 37, fontWeight: "900", marginTop: spacing.xxl, maxWidth: 380 },
  heroLead: { color: "#DCE9D8", fontSize: 15, lineHeight: 23, marginTop: spacing.md, maxWidth: 520 },
  stats: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.xxl },
  stat: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: "rgba(255,255,255,0.1)" },
  statLabel: { color: colors.white, fontSize: 11, fontWeight: "800" },
  languageCard: { marginTop: spacing.xl, backgroundColor: colors.surface, borderRadius: radii.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, ...shadows.card },
  languageCopy: { marginTop: spacing.md },
  segmented: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg, backgroundColor: colors.neutralSurface, borderRadius: radii.md, padding: 4 },
  languageOption: { flex: 1, minHeight: 46, borderRadius: 11, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6 },
  languageOptionActive: { backgroundColor: colors.surface, ...shadows.card },
  languageLabel: { color: colors.muted, fontSize: 14, fontWeight: "800" },
  languageLabelActive: { color: colors.primaryDark },
  pressed: { opacity: 0.76 },
  infoCard: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md, backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, marginTop: spacing.md, ...shadows.card },
  cardIcon: { width: 46, height: 46, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: colors.primaryLight },
  infoBody: { flex: 1 },
  cardTitle: { color: colors.ink, fontSize: 17, lineHeight: 22, fontWeight: "900" },
  cardText: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: 5 },
  languageNote: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, backgroundColor: colors.warningSurface, borderRadius: radii.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.warningBorder, marginTop: spacing.md },
  languageNoteText: { flex: 1, color: colors.warning, fontSize: 13, lineHeight: 19 },
  footer: { alignItems: "center", marginTop: spacing.xxxl, paddingBottom: spacing.md },
  footerMark: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: colors.primary },
  version: { color: colors.inkSoft, fontWeight: "900", marginTop: spacing.md },
  disclaimer: { color: colors.subtle, fontSize: 11, lineHeight: 16, textAlign: "center", marginTop: 5, maxWidth: 340 },
});
