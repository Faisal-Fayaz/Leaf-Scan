export type ScanMode = "disease" | "pest";

export interface Prediction {
  classId: string;
  label: string;
  confidence: number; // normalized 0-1 model score; not a calibrated probability
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

// Conservative rejection thresholds. A softmax score is not an agricultural
// probability, so every accepted result remains a possible match to confirm.
export const LOW_CONFIDENCE_THRESHOLD = 0.6;
export const AMBIGUOUS_MARGIN_THRESHOLD = 0.08;
