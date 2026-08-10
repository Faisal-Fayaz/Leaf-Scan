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
import { useDiseaseModel, diseaseClassNames } from "@/hooks/useTFLiteModels";
import { useLivePrediction } from "@/hooks/useLivePrediction";
import { getTreatment } from "@/data/treatments";
import { ScanResult } from "@/types";
import { useScanHistory } from "@/hooks/useScanHistory";
import { jpegToModelInput, runModelPrediction } from "@/lib/imageInference";
import { cropFromLabel, humanizeLabel } from "@/lib/labels";
import { centeredSquareCrop } from "@/lib/imageGeometry";
import {
  getResultSafetyStatus,
  hasAmbiguousMargin,
  isPredictionUncertain,
} from "@/lib/resultSafety";

export function ScanScreen({ navigation }: { navigation: any }) {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice("back");
  const cameraRef = useRef<Camera>(null);

  const diseaseModel = useDiseaseModel();
  const { frameProcessor, livePrediction } = useLivePrediction(diseaseModel.model);

  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { addScan } = useScanHistory();

  useEffect(() => {
    if (!hasPermission) void requestPermission();
  }, [hasPermission, requestPermission]);

  const modelsReady = diseaseModel.state === "loaded";
  const liveIsUncertain = livePrediction ? isPredictionUncertain(livePrediction) : true;

  const saveAndOpenResult = useCallback(
    async (result: ScanResult) => {
      const safetyStatus = getResultSafetyStatus(result);
      const hasPossibleMatch = safetyStatus === "possible-match";
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
      });
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
      if (
        diseaseModel.state !== "loaded" ||
        !diseaseModel.model
      ) {
        throw new Error("The offline models are not ready");
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

        const imageBuffer = base64ArrayBuffer.decode(manipulated.base64);
        const modelInput = jpegToModelInput(imageBuffer);
        const prediction = runModelPrediction(
          diseaseModel.model,
          modelInput,
          diseaseClassNames,
          "disease"
        );
        if (!prediction) throw new Error("No model prediction was returned");

        const isLowConfidence = isPredictionUncertain(prediction);

        await saveAndOpenResult({
          imageUri,
          topPrediction: prediction,
          alternativePredictions: [],
          treatment: getTreatment(prediction.classId),
          isLowConfidence,
          isAmbiguous: hasAmbiguousMargin(prediction),
          source,
        });
      } finally {
        if (manipulatedUri) {
          await FileSystem.deleteAsync(manipulatedUri, { idempotent: true }).catch(() => undefined);
        }
      }
    },
    [diseaseModel, saveAndOpenResult]
  );

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || busy) return;

    setBusy(true);
    setErrorMessage(null);
    try {
      const photo = await cameraRef.current.takePhoto({ flash: "off" });
      const imageUri = photo.path.startsWith("file://") ? photo.path : `file://${photo.path}`;
      await analyzeAndOpenResult(imageUri, photo.width, photo.height, "camera");
    } catch (error) {
      console.error("Camera capture failed:", error);
      setErrorMessage("We could not capture this scan. Try again in better light.");
    } finally {
      setBusy(false);
    }
  }, [analyzeAndOpenResult, busy]);

  const handlePickFromGallery = useCallback(async () => {
    if (busy) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setErrorMessage("Photo-library permission is needed to choose a leaf image.");
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
      setErrorMessage("This image could not be analyzed. Choose a clear, well-lit photo of one leaf.");
    } finally {
      setBusy(false);
    }
  }, [
    busy,
    analyzeAndOpenResult,
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
          <Text style={styles.overlayLabel}>
            {liveIsUncertain
              ? "No reliable live match"
              : `Possible ${humanizeLabel(livePrediction.label)}`}
          </Text>
          <Text style={styles.overlayConfidence}>
            {liveIsUncertain
              ? "Try steadier framing and even daylight"
              : `${Math.round(livePrediction.confidence * 100)}% model score`}
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

        <TouchableOpacity style={styles.captureButton} onPress={handleCapture} disabled={busy}>
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
