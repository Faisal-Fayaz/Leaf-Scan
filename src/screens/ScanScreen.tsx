import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { useIsFocused } from "@react-navigation/native";
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  usePhotoOutput,
} from "react-native-vision-camera";
import * as ImagePicker from "expo-image-picker";
import { File } from "expo-file-system";
import * as ImageManipulator from "expo-image-manipulator";
import { decode as decodeBase64ArrayBuffer } from "base64-arraybuffer";
import { AppButton } from "@/components/AppButton";
import { StatusPill } from "@/components/StatusPill";
import { useDiseaseModel, diseaseClassNames } from "@/hooks/useTFLiteModels";
import { useScanHistory } from "@/hooks/useScanHistory";
import { useI18n } from "@/i18n";
import { getTreatment } from "@/data/treatments";
import type { ScanResult } from "@/types";
import { jpegToModelInput, runModelPrediction } from "@/lib/imageInference";
import { cropFromLabel, humanizeLabel } from "@/lib/labels";
import { centeredSquareCrop } from "@/lib/imageGeometry";
import { shouldActivateCamera } from "@/lib/cameraLifecycle";
import {
  getResultSafetyStatus,
  hasAmbiguousMargin,
  isPredictionUncertain,
} from "@/lib/resultSafety";
import { colors, radii, shadows, spacing } from "@/theme";

export function ScanScreen({ navigation }: { navigation: any }) {
  const { t } = useI18n();
  const { hasPermission, canRequestPermission, requestPermission } = useCameraPermission();
  const isFocused = useIsFocused();
  const device = useCameraDevice("back");
  const photoOutput = usePhotoOutput({
    containerFormat: "jpeg",
    quality: 0.9,
    qualityPrioritization: "balanced",
  });
  const cameraOutputs = useMemo(() => [photoOutput], [photoOutput]);

  const [modelRetryKey, setModelRetryKey] = useState(0);
  const diseaseModel = useDiseaseModel(modelRetryKey);
  const [busy, setBusy] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [appState, setAppState] = useState(AppState.currentState);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { addScan } = useScanHistory();

  useEffect(() => {
    const subscription = AppState.addEventListener("change", setAppState);
    return () => subscription.remove();
  }, []);

  const modelsReady = diseaseModel.state === "loaded";
  const cameraIsActive = shouldActivateCamera(isFocused, appState, busy);

  const saveAndOpenResult = useCallback(
    async (result: ScanResult) => {
      const safetyStatus = getResultSafetyStatus(result);
      const hasPossibleMatch = safetyStatus === "possible-match";
      try {
        await addScan({
          diagnosis: hasPossibleMatch
            ? `Possible ${humanizeLabel(result.topPrediction.label)}`
            : safetyStatus === "uncertain"
              ? "Uncertain scan"
              : "Unsupported scan",
          confidence: result.topPrediction.confidence,
          type: hasPossibleMatch ? "disease" : "unknown",
          imageUri: result.imageUri,
          crop: hasPossibleMatch ? cropFromLabel(result.topPrediction.label) : undefined,
          classId: result.topPrediction.classId,
          isAmbiguous: !hasPossibleMatch,
          result,
        });
      } catch (historyError) {
        console.error("Failed to save this scan to history:", historyError);
      }
      if (Platform.OS !== "web") {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      navigation.navigate("Result", { result });
    },
    [addScan, navigation]
  );

  const analyzeAndOpenResult = useCallback(
    async (
      imageUri: string,
      width: number,
      height: number,
      source: "camera" | "gallery"
    ) => {
      if (diseaseModel.state !== "loaded" || !diseaseModel.model) {
        throw new Error("The offline model is not ready");
      }

      let manipulatedUri: string | undefined;
      try {
        const manipulated = await ImageManipulator.manipulateAsync(
          imageUri,
          [
            { crop: centeredSquareCrop(width, height) },
            { resize: { width: 224, height: 224 } },
          ],
          {
            base64: true,
            format: ImageManipulator.SaveFormat.JPEG,
            compress: 0.92,
          }
        );
        manipulatedUri = manipulated.uri;
        if (!manipulated.base64) throw new Error("Image preprocessing returned no data");

        const imageBuffer = decodeBase64ArrayBuffer(manipulated.base64);
        const modelInput = jpegToModelInput(imageBuffer);
        const prediction = runModelPrediction(
          diseaseModel.model,
          modelInput,
          diseaseClassNames,
          "disease"
        );
        if (!prediction) throw new Error("No model prediction was returned");

        await saveAndOpenResult({
          imageUri,
          topPrediction: prediction,
          alternativePredictions: [],
          treatment: getTreatment(prediction.classId),
          isLowConfidence: isPredictionUncertain(prediction),
          isAmbiguous: hasAmbiguousMargin(prediction),
          source,
        });
      } finally {
        if (manipulatedUri) {
          try {
            const temporaryFile = new File(manipulatedUri);
            if (temporaryFile.exists) temporaryFile.delete();
          } catch {
            // Temporary inference images are also eligible for OS cache cleanup.
          }
        }
      }
    },
    [diseaseModel, saveAndOpenResult]
  );

  const handleCapture = useCallback(async () => {
    if (!cameraReady || busy) return;

    setBusy(true);
    setErrorMessage(null);
    if (Platform.OS !== "web") {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    let photo: Awaited<ReturnType<typeof photoOutput.capturePhoto>> | undefined;
    try {
      photo = await photoOutput.capturePhoto({ flashMode: "off" }, {});
      const photoPath = await photo.saveToTemporaryFileAsync();
      const imageUri = photoPath.startsWith("file://") ? photoPath : `file://${photoPath}`;
      await analyzeAndOpenResult(imageUri, photo.width, photo.height, "camera");
    } catch (error) {
      console.error("Camera capture failed:", error);
      setErrorMessage(t("scan.captureError"));
      if (Platform.OS !== "web") {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      photo?.dispose();
      setBusy(false);
    }
  }, [analyzeAndOpenResult, busy, cameraReady, photoOutput, t]);

  const handlePickFromGallery = useCallback(async () => {
    if (busy) return;
    if (diseaseModel.state !== "loaded") {
      setErrorMessage(t("scan.cameraNotReady"));
      return;
    }

    if (Platform.OS !== "web") void Haptics.selectionAsync();
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setErrorMessage(t("scan.libraryPermission"));
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      quality: 0.9,
      allowsEditing: false,
    });
    if (pickerResult.canceled || !pickerResult.assets[0]) return;

    setBusy(true);
    setErrorMessage(null);
    try {
      const asset = pickerResult.assets[0];
      await analyzeAndOpenResult(asset.uri, asset.width, asset.height, "gallery");
    } catch (error) {
      console.error("Gallery scan failed:", error);
      setErrorMessage(t("scan.galleryError"));
      if (Platform.OS !== "web") {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setBusy(false);
    }
  }, [analyzeAndOpenResult, busy, diseaseModel.state, t]);

  if (diseaseModel.state === "error") {
    return (
      <ScanStateScreen
        icon="cloud-offline-outline"
        title={t("scan.modelErrorTitle")}
        body={t("scan.modelErrorBody")}
      >
        <AppButton
          label={t("scan.modelRetry")}
          icon="refresh"
          onPress={() => setModelRetryKey((key) => key + 1)}
          style={styles.stateButton}
        />
      </ScanStateScreen>
    );
  }

  if (!hasPermission) {
    return (
      <ScanStateScreen
        icon="camera-outline"
        title={t("scan.permissionTitle")}
        body={t("scan.permissionBody")}
      >
        <AppButton
          label={canRequestPermission ? t("scan.allowCamera") : t("scan.openSettings")}
          icon={canRequestPermission ? "camera" : "settings-outline"}
          onPress={() => {
            if (canRequestPermission) void requestPermission();
            else void Linking.openSettings();
          }}
          style={styles.stateButton}
        />
        <AppButton
          label={t("scan.chooseGallery")}
          icon="images-outline"
          variant="secondary"
          disabled={!modelsReady}
          onPress={handlePickFromGallery}
          style={styles.stateButtonSecondary}
        />
      </ScanStateScreen>
    );
  }

  if (!modelsReady) {
    return (
      <ScanStateScreen
        icon="leaf-outline"
        title={t("scan.modelLoadingTitle")}
        body={t("scan.modelLoadingBody")}
        loading
      />
    );
  }

  if (device == null) {
    return (
      <ScanStateScreen
        icon="camera-reverse-outline"
        title={t("scan.noCameraTitle")}
        body={t("scan.noCameraBody")}
      >
        <AppButton
          label={t("scan.chooseGallery")}
          icon="images-outline"
          onPress={handlePickFromGallery}
          style={styles.stateButton}
        />
      </ScanStateScreen>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={cameraIsActive}
        outputs={cameraOutputs}
        onStarted={() => setCameraReady(true)}
        onStopped={() => setCameraReady(false)}
        onError={(error) => {
          console.error("Camera session failed:", error);
          setCameraReady(false);
          setErrorMessage(t("scan.cameraError"));
        }}
      />
      <LinearGradient
        colors={["rgba(7,18,12,0.82)", "rgba(7,18,12,0.05)", "rgba(7,18,12,0.92)"]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <SafeAreaView style={styles.overlay} edges={["top", "bottom"]}>
        <View style={styles.cameraHeader}>
          <View>
            <Text style={styles.cameraBrand}>{t("app.name")}</Text>
            <Text style={styles.cameraTitle}>{t("scan.frameTitle")}</Text>
          </View>
          <StatusPill label={t("scan.privateBadge")} icon="lock-closed" tone="dark" />
        </View>

        <View style={styles.guideArea} pointerEvents="none">
          <View style={styles.scanGuide}>
            <GuideCorner position="topLeft" />
            <GuideCorner position="topRight" />
            <GuideCorner position="bottomLeft" />
            <GuideCorner position="bottomRight" />
            <View style={styles.guideLabel}>
              <Ionicons name="leaf-outline" size={15} color={colors.white} />
              <Text style={styles.guideLabelText}>{t("scan.frameHint")}</Text>
            </View>
          </View>
        </View>

        {errorMessage && (
          <View style={styles.errorBanner} accessibilityRole="alert">
            <Ionicons name="alert-circle" size={21} color={colors.danger} />
            <Text style={styles.errorText}>{errorMessage}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("common.dismiss")}
              hitSlop={8}
              onPress={() => setErrorMessage(null)}
            >
              <Ionicons name="close" size={22} color={colors.danger} />
            </Pressable>
          </View>
        )}

        <View style={styles.cameraPanel}>
          <View style={styles.busyLine}>
            {busy ? (
              <>
                <ActivityIndicator size="small" color={colors.lime} />
                <Text style={styles.busyText}>{t("scan.analyzing")}</Text>
              </>
            ) : (
              <>
                <Ionicons name="phone-portrait-outline" size={15} color={colors.lime} />
                <Text style={styles.busyText}>{t("common.offline")}</Text>
              </>
            )}
          </View>

          <View style={styles.controls}>
            <CameraSideButton
              icon="images-outline"
              label={t("common.gallery")}
              accessibilityLabel={t("scan.galleryA11y")}
              disabled={busy}
              onPress={handlePickFromGallery}
            />

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("scan.captureA11y")}
              accessibilityState={{ disabled: busy || !cameraReady, busy }}
              disabled={busy || !cameraReady}
              onPress={handleCapture}
              style={({ pressed }) => [
                styles.captureButton,
                pressed ? styles.capturePressed : undefined,
                busy || !cameraReady ? styles.captureDisabled : undefined,
              ]}
            >
              <View style={styles.captureInner}>
                {busy ? (
                  <ActivityIndicator color={colors.primaryDark} />
                ) : (
                  <Ionicons name="leaf" size={27} color={colors.primaryDark} />
                )}
              </View>
            </Pressable>

            <View style={styles.sidePlaceholder}>
              <View style={styles.offlineDot} />
              <Text style={styles.readyText}>{cameraReady ? t("scan.ready") : "…"}</Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

function ScanStateScreen({
  icon,
  title,
  body,
  loading = false,
  children,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  body: string;
  loading?: boolean;
  children?: React.ReactNode;
}) {
  const { t } = useI18n();
  return (
    <LinearGradient colors={[colors.canvas, "#E5F1E1"]} style={styles.stateBackground}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.stateSafeArea}>
        <StatusPill label={t("common.offline")} icon="cloud-offline-outline" />
        <View style={styles.stateContent}>
          <View style={styles.stateIconWrap}>
            {loading ? (
              <ActivityIndicator size="large" color={colors.primary} />
            ) : (
              <Ionicons name={icon} size={42} color={colors.primary} />
            )}
          </View>
          <Text style={styles.stateTitle}>{title}</Text>
          <Text style={styles.stateBody}>{body}</Text>
          {children && <View style={styles.stateActions}>{children}</View>}
        </View>
        <View style={styles.privacyLine}>
          <Ionicons name="lock-closed-outline" size={15} color={colors.muted} />
          <Text style={styles.privacyText}>{t("scan.privateBadge")}</Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

function GuideCorner({ position }: { position: "topLeft" | "topRight" | "bottomLeft" | "bottomRight" }) {
  return <View style={[styles.guideCorner, styles[position]]} />;
}

function CameraSideButton({
  icon,
  label,
  accessibilityLabel,
  disabled,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  accessibilityLabel: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.sideButton,
        pressed ? styles.sideButtonPressed : undefined,
        disabled ? styles.captureDisabled : undefined,
      ]}
    >
      <View style={styles.sideButtonIcon}>
        <Ionicons name={icon} size={23} color={colors.white} />
      </View>
      <Text style={styles.sideButtonLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black },
  overlay: { flex: 1, paddingHorizontal: spacing.xl },
  cameraHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
    paddingTop: spacing.sm,
  },
  cameraBrand: { color: colors.lime, fontSize: 12, fontWeight: "900", letterSpacing: 2 },
  cameraTitle: { color: colors.white, fontSize: 20, lineHeight: 25, fontWeight: "900", marginTop: 4 },
  guideArea: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: spacing.lg },
  scanGuide: { width: "79%", maxWidth: 360, aspectRatio: 0.82, position: "relative" },
  guideCorner: { position: "absolute", width: 42, height: 42, borderColor: colors.white },
  topLeft: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 18 },
  topRight: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 18 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 18 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 18 },
  guideLabel: {
    position: "absolute",
    bottom: 14,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: colors.cameraOverlay,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  guideLabelText: { color: colors.white, fontSize: 11, fontWeight: "700" },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.dangerSurface,
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
    marginBottom: spacing.md,
  },
  errorText: { flex: 1, color: colors.danger, fontSize: 13, lineHeight: 18, fontWeight: "600" },
  cameraPanel: {
    backgroundColor: colors.cameraPanel,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    ...shadows.floating,
  },
  busyLine: { minHeight: 22, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  busyText: { color: "#DCE9D8", fontSize: 12, fontWeight: "700" },
  controls: { marginTop: spacing.md, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  captureButton: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 3,
    borderColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  captureInner: { width: 66, height: 66, borderRadius: 33, backgroundColor: colors.white, alignItems: "center", justifyContent: "center" },
  capturePressed: { transform: [{ scale: 0.94 }] },
  captureDisabled: { opacity: 0.46 },
  sideButton: { width: 72, alignItems: "center", gap: 5 },
  sideButtonPressed: { opacity: 0.75, transform: [{ scale: 0.96 }] },
  sideButtonIcon: { width: 48, height: 48, borderRadius: radii.md, backgroundColor: "rgba(255,255,255,0.14)", alignItems: "center", justifyContent: "center" },
  sideButtonLabel: { color: colors.white, fontSize: 11, fontWeight: "800" },
  sidePlaceholder: { width: 72, alignItems: "center", gap: 7 },
  offlineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.lime, marginTop: 10 },
  readyText: { color: "#C9D7C5", fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  stateBackground: { flex: 1 },
  stateSafeArea: { flex: 1, padding: spacing.xl },
  stateContent: { flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: spacing.huge },
  stateIconWrap: { width: 92, height: 92, borderRadius: 30, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", ...shadows.card },
  stateTitle: { maxWidth: 340, color: colors.ink, fontSize: 28, lineHeight: 34, fontWeight: "900", textAlign: "center", marginTop: spacing.xxl },
  stateBody: { maxWidth: 370, color: colors.muted, fontSize: 15, lineHeight: 23, textAlign: "center", marginTop: spacing.md },
  stateActions: { width: "100%", maxWidth: 380, marginTop: spacing.xxl },
  stateButton: { width: "100%" },
  stateButtonSecondary: { width: "100%", marginTop: spacing.md },
  privacyLine: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, paddingBottom: spacing.sm },
  privacyText: { color: colors.muted, fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
});
