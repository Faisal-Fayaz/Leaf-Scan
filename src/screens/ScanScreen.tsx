import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Camera, useCameraDevice, useCameraPermission } from "react-native-vision-camera";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import * as ImageManipulator from "expo-image-manipulator";
import base64ArrayBuffer from "base64-arraybuffer";
import { useDiseaseModel, usePestModel, diseaseClassNames, pestClassNames } from "@/hooks/useTFLiteModels";
import { useLivePrediction } from "@/hooks/useLivePrediction";
import { getTreatment } from "@/data/treatments";
import { AMBIGUOUS_MARGIN_THRESHOLD, LOW_CONFIDENCE_THRESHOLD, ScanResult } from "@/types";
import { useScanHistory } from "@/hooks/useScanHistory";
import { runStaticPrediction } from "@/lib/imageInference";
import { selectBestPrediction } from "@/lib/prediction";
import { cropFromLabel, humanizeLabel } from "@/lib/labels";

export function ScanScreen({ navigation }: { navigation: any }) {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice("back");
  const cameraRef = useRef<Camera>(null);

  const diseaseModel = useDiseaseModel();
  const pestModel = usePestModel();
  const { frameProcessor, livePrediction } = useLivePrediction(
    diseaseModel.model,
    pestModel.model
  );

  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { addScan } = useScanHistory();

  useEffect(() => {
    if (!hasPermission) void requestPermission();
  }, [hasPermission, requestPermission]);

  const modelsReady = diseaseModel.state === "loaded" && pestModel.state === "loaded";

  const saveAndOpenResult = useCallback(
    async (result: ScanResult) => {
      await addScan({
        diagnosis: humanizeLabel(result.topPrediction.label),
        confidence: result.topPrediction.confidence,
        type: result.topPrediction.mode,
        imageUri: result.imageUri,
        crop: cropFromLabel(result.topPrediction.label),
        classId: result.topPrediction.classId,
        isAmbiguous: result.isAmbiguous,
      });
      navigation.navigate("Result", { result });
    },
    [addScan, navigation]
  );

  const getPredictionFromImageUri = useCallback(
    async (
      uri: string,
      model: { model: any; state: string },
      classNames: string[],
      mode: "disease" | "pest"
    ) => {
      if (model.state !== "loaded" || !model.model) return null;

      let manipulatedUri: string | undefined;
      try {
        const manipulated = await ImageManipulator.manipulateAsync(
          uri,
          [{ resize: { width: 224, height: 224 } }],
          { format: ImageManipulator.SaveFormat.JPEG, compress: 0.92 }
        );
        manipulatedUri = manipulated.uri;

        const base64 = await FileSystem.readAsStringAsync(manipulated.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const imageBuffer = base64ArrayBuffer.decode(base64);
        return runStaticPrediction(model.model, imageBuffer, classNames, mode);
      } finally {
        if (manipulatedUri) {
          await FileSystem.deleteAsync(manipulatedUri, { idempotent: true }).catch(() => undefined);
        }
      }
    },
    []
  );

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || !livePrediction || busy) return;

    setBusy(true);
    setErrorMessage(null);
    try {
      const photo = await cameraRef.current.takePhoto({ flash: "off" });
      const imageUri = photo.path.startsWith("file://") ? photo.path : `file://${photo.path}`;
      const isLowConfidence =
        livePrediction.confidence < LOW_CONFIDENCE_THRESHOLD ||
        (livePrediction.margin ?? 1) < AMBIGUOUS_MARGIN_THRESHOLD;

      await saveAndOpenResult({
        imageUri,
        topPrediction: livePrediction,
        alternativePredictions: [],
        treatment: getTreatment(livePrediction.classId),
        isLowConfidence,
        source: "camera",
      });
    } catch (error) {
      console.error("Camera capture failed:", error);
      setErrorMessage("We could not capture this scan. Try again in better light.");
    } finally {
      setBusy(false);
    }
  }, [busy, livePrediction, saveAndOpenResult]);

  const handlePickFromGallery = useCallback(async () => {
    if (busy) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setErrorMessage("Photo-library permission is needed to choose a leaf image.");
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.9,
      allowsEditing: false,
    });

    if (pickerResult.canceled || !pickerResult.assets[0]) return;

    setBusy(true);
    setErrorMessage(null);
    try {
      const imageUri = pickerResult.assets[0].uri;
      const [diseasePrediction, pestPrediction] = await Promise.all([
        getPredictionFromImageUri(imageUri, diseaseModel, diseaseClassNames, "disease"),
        getPredictionFromImageUri(imageUri, pestModel, pestClassNames, "pest"),
      ]);
      const selected = selectBestPrediction([diseasePrediction, pestPrediction]);
      if (!selected.prediction) throw new Error("No model prediction was returned");

      const prediction = selected.prediction;
      const isLowConfidence =
        prediction.confidence < LOW_CONFIDENCE_THRESHOLD ||
        (prediction.margin ?? 1) < AMBIGUOUS_MARGIN_THRESHOLD ||
        selected.ambiguous;

      await saveAndOpenResult({
        imageUri,
        topPrediction: prediction,
        alternativePredictions: [diseasePrediction, pestPrediction].filter(
          (candidate) => candidate !== null && candidate.classId !== prediction.classId
        ),
        treatment: getTreatment(prediction.classId),
        isLowConfidence,
        isAmbiguous: selected.ambiguous,
        source: "gallery",
      });
    } catch (error) {
      console.error("Gallery scan failed:", error);
      setErrorMessage("This image could not be analyzed. Choose a clear, well-lit photo of one leaf.");
    } finally {
      setBusy(false);
    }
  }, [
    busy,
    diseaseModel,
    getPredictionFromImageUri,
    pestModel,
    saveAndOpenResult,
  ]);

  if (!hasPermission) {
    return (
      <View style={styles.centered}>
        <Text style={styles.icon}>⌁</Text>
        <Text style={styles.title}>Camera access is needed</Text>
        <Text style={styles.permissionText}>
          LeafScan processes photos on this device. Camera access is only used for scanning.
        </Text>
        <TouchableOpacity style={styles.primaryButton} onPress={requestPermission}>
          <Text style={styles.primaryButtonText}>Allow camera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={handlePickFromGallery}>
          <Text style={styles.secondaryButtonText}>Choose from gallery</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (device == null || !modelsReady) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4C7A3D" />
        <Text style={styles.title}>{device == null ? "Preparing camera…" : "Loading offline models…"}</Text>
        <Text style={styles.permissionText}>
          The first startup can take a moment. Your photos never leave the device.
        </Text>
        {modelsReady && (
          <TouchableOpacity style={styles.secondaryButton} onPress={handlePickFromGallery}>
            <Text style={styles.secondaryButtonText}>Choose from gallery</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={!busy}
        photo={true}
        frameProcessor={frameProcessor}
      />

      <View style={styles.topHint}>
        <Text style={styles.topHintTitle}>Frame one affected leaf</Text>
        <Text style={styles.topHintText}>Use daylight and keep the leaf in focus</Text>
      </View>

      {livePrediction && (
        <View style={styles.overlay}>
          <Text style={styles.overlayEyebrow}>Live estimate</Text>
          <Text style={styles.overlayLabel}>{humanizeLabel(livePrediction.label)}</Text>
          <Text style={styles.overlayConfidence}>
            {Math.round(livePrediction.confidence * 100)}% model score
          </Text>
        </View>
      )}

      {errorMessage && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <TouchableOpacity onPress={() => setErrorMessage(null)}>
            <Text style={styles.dismissText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.controls}>
        <TouchableOpacity style={styles.galleryButton} onPress={handlePickFromGallery} disabled={busy}>
          <Text style={styles.galleryButtonIcon}>▧</Text>
          <Text style={styles.galleryButtonText}>Gallery</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.captureButton} onPress={handleCapture} disabled={busy || !livePrediction}>
          {busy ? <ActivityIndicator color="#FFFFFF" /> : <View style={styles.captureInner} />}
        </TouchableOpacity>

        <View style={styles.controlSpacer} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#10150E" },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 28,
    backgroundColor: "#F4F7F1",
  },
  icon: { fontSize: 42, color: "#4C7A3D", marginBottom: 8 },
  title: { fontSize: 22, fontWeight: "800", color: "#1F2A1A", textAlign: "center", marginTop: 10 },
  permissionText: { fontSize: 15, color: "#52624D", marginTop: 12, textAlign: "center", lineHeight: 22 },
  primaryButton: { marginTop: 22, backgroundColor: "#4C7A3D", paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14 },
  primaryButtonText: { color: "#FFFFFF", fontWeight: "800", fontSize: 15 },
  secondaryButton: { marginTop: 12, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: "#B9C8B2" },
  secondaryButtonText: { color: "#4C7A3D", fontWeight: "700" },
  topHint: { position: "absolute", top: 48, alignSelf: "center", alignItems: "center" },
  topHintTitle: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
  topHintText: { color: "#D7E4CE", fontSize: 12, marginTop: 4 },
  overlay: { position: "absolute", top: 104, alignSelf: "center", alignItems: "center", backgroundColor: "rgba(15,25,12,0.78)", paddingHorizontal: 18, paddingVertical: 11, borderRadius: 16 },
  overlayEyebrow: { color: "#BBD7AD", fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8 },
  overlayLabel: { color: "#FFFFFF", fontSize: 17, fontWeight: "800", marginTop: 2, textAlign: "center" },
  overlayConfidence: { color: "#D7E4CE", fontSize: 12, marginTop: 3 },
  errorBanner: { position: "absolute", top: 170, left: 18, right: 18, backgroundColor: "#FFF3EC", borderRadius: 14, padding: 13, flexDirection: "row", alignItems: "center", gap: 10 },
  errorText: { color: "#873B25", flex: 1, lineHeight: 19 },
  dismissText: { color: "#873B25", fontWeight: "800" },
  controls: { position: "absolute", bottom: 38, left: 0, right: 0, flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 30 },
  captureButton: { width: 78, height: 78, borderRadius: 39, backgroundColor: "rgba(255,255,255,0.22)", borderWidth: 4, borderColor: "#FFFFFF", justifyContent: "center", alignItems: "center" },
  captureInner: { width: 61, height: 61, borderRadius: 31, backgroundColor: "#FFFFFF" },
  galleryButton: { width: 72, alignItems: "center" },
  galleryButtonIcon: { color: "#FFFFFF", fontSize: 25, lineHeight: 27 },
  galleryButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700", marginTop: 2 },
  controlSpacer: { width: 72 },
});
