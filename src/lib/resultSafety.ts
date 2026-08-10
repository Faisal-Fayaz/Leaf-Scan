import type { Prediction, ScanResult } from "@/types";
import { AMBIGUOUS_MARGIN_THRESHOLD, LOW_CONFIDENCE_THRESHOLD } from "@/types";

export type ResultSafetyStatus = "possible-match" | "uncertain" | "unsupported";

export function hasAmbiguousMargin(prediction: Prediction): boolean {
  return (prediction.margin ?? 0) < AMBIGUOUS_MARGIN_THRESHOLD;
}

export function isPredictionUncertain(prediction: Prediction): boolean {
  return (
    prediction.confidence < LOW_CONFIDENCE_THRESHOLD ||
    hasAmbiguousMargin(prediction)
  );
}

export function getResultSafetyStatus(result: ScanResult): ResultSafetyStatus {
  if (result.topPrediction.mode !== "disease") return "unsupported";
  if (result.isLowConfidence || result.isAmbiguous) return "uncertain";
  if (!result.treatment) return "unsupported";
  return "possible-match";
}
