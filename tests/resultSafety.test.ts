import assert from "node:assert/strict";
import test from "node:test";
import type { Prediction, ScanResult, TreatmentInfo } from "../src/types";
import {
  getResultSafetyStatus,
  hasAmbiguousMargin,
  isPredictionUncertain,
} from "../src/lib/resultSafety";

const prediction: Prediction = {
  classId: "Tomato___Early_blight",
  label: "Tomato___Early_blight",
  confidence: 0.82,
  margin: 0.3,
  mode: "disease",
};

const treatment: TreatmentInfo = {
  classId: prediction.classId,
  displayName: "Early Blight",
  description: "Test guidance",
  organicTreatment: [],
  chemicalTreatment: [],
  severity: "moderate",
};

function makeResult(overrides: Partial<ScanResult> = {}): ScanResult {
  return {
    imageUri: "file://leaf.jpg",
    topPrediction: prediction,
    alternativePredictions: [],
    treatment,
    isLowConfidence: false,
    ...overrides,
  };
}

test("allows guidance only for a supported possible match", () => {
  assert.equal(getResultSafetyStatus(makeResult()), "possible-match");
});

test("rejects low-score and close within-model results", () => {
  assert.equal(isPredictionUncertain({ ...prediction, confidence: 0.59 }), true);
  assert.equal(isPredictionUncertain({ ...prediction, margin: 0.07 }), true);
  assert.equal(hasAmbiguousMargin({ ...prediction, margin: undefined }), true);
  assert.equal(getResultSafetyStatus(makeResult({ isLowConfidence: true })), "uncertain");
});

test("rejects unverified pest output even with a high score", () => {
  const pestPrediction = { ...prediction, classId: "42", label: "42", mode: "pest" as const };
  assert.equal(
    getResultSafetyStatus(makeResult({ topPrediction: pestPrediction, treatment: null })),
    "unsupported"
  );
});
