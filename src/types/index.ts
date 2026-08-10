export type ScanMode = "disease" | "pest";

export interface Prediction {
  classId: string;
  label: string;
  confidence: number; // calibrated/normalized 0-1 estimate
  margin?: number; // distance from the model's second-best class
  mode: ScanMode;
}

export type Severity = "info" | "moderate" | "urgent";

export interface TreatmentInfo {
  classId: string;
  displayName: string;
  crop?: string;
  description: string;
  organicTreatment: string[];
  chemicalTreatment: string[];
  severity: Severity;
}

export interface ScanResult {
  imageUri: string;
  topPrediction: Prediction;
  alternativePredictions: Prediction[];
  treatment: TreatmentInfo | null;
  isLowConfidence: boolean;
  isAmbiguous?: boolean;
  source?: "camera" | "gallery";
}

// Conservative threshold: a softmax score is not an agricultural probability,
// so the app must not present a low-score result as definitive.
export const LOW_CONFIDENCE_THRESHOLD = 0.6;
export const AMBIGUOUS_MARGIN_THRESHOLD = 0.08;
