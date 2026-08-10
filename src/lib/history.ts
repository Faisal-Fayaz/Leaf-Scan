import type { Prediction, ScanResult, Severity, TreatmentInfo } from "@/types";

export const HISTORY_STORAGE_KEY = "@leafscan_history";
export const HISTORY_STORAGE_VERSION = 1;
export const MAX_HISTORY_ITEMS = 50;

export type ScanHistoryItem = {
  id: string;
  timestamp: number;
  imageUri?: string;
  diagnosis: string;
  confidence: number;
  type: "disease" | "pest" | "unknown";
  crop?: string;
  classId?: string;
  isAmbiguous?: boolean;
  result?: ScanResult;
};

export type NewScanHistoryItem = Omit<ScanHistoryItem, "id" | "timestamp">;

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isPrediction(value: unknown): value is Prediction {
  if (!value || typeof value !== "object") return false;
  const prediction = value as Partial<Prediction>;
  return (
    typeof prediction.classId === "string" &&
    typeof prediction.label === "string" &&
    typeof prediction.confidence === "number" &&
    Number.isFinite(prediction.confidence) &&
    (prediction.margin === undefined ||
      (typeof prediction.margin === "number" && Number.isFinite(prediction.margin))) &&
    (prediction.mode === "disease" || prediction.mode === "pest")
  );
}

function isTreatment(value: unknown): value is TreatmentInfo {
  if (!value || typeof value !== "object") return false;
  const treatment = value as Partial<TreatmentInfo>;
  const validSeverities: Severity[] = ["info", "moderate", "urgent"];
  return (
    typeof treatment.classId === "string" &&
    typeof treatment.displayName === "string" &&
    typeof treatment.description === "string" &&
    isStringArray(treatment.organicTreatment) &&
    isStringArray(treatment.chemicalTreatment) &&
    treatment.severity !== undefined &&
    validSeverities.includes(treatment.severity)
  );
}

function isScanResult(value: unknown): value is ScanResult {
  if (!value || typeof value !== "object") return false;
  const result = value as Partial<ScanResult>;
  return (
    typeof result.imageUri === "string" &&
    isPrediction(result.topPrediction) &&
    Array.isArray(result.alternativePredictions) &&
    result.alternativePredictions.every(isPrediction) &&
    (result.treatment === null || isTreatment(result.treatment)) &&
    typeof result.isLowConfidence === "boolean" &&
    (result.isAmbiguous === undefined || typeof result.isAmbiguous === "boolean") &&
    (result.source === undefined || result.source === "camera" || result.source === "gallery")
  );
}

function sanitizeHistoryItem(value: unknown): ScanHistoryItem | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Partial<ScanHistoryItem>;
  if (
    typeof item.id !== "string" ||
    item.id.length === 0 ||
    typeof item.timestamp !== "number" ||
    !Number.isFinite(item.timestamp) ||
    typeof item.diagnosis !== "string" ||
    typeof item.confidence !== "number" ||
    !Number.isFinite(item.confidence)
  ) {
    return null;
  }

  const result = isScanResult(item.result) ? item.result : undefined;
  const imageUri =
    typeof item.imageUri === "string" ? item.imageUri : result?.imageUri;
  const type =
    item.type === "disease" || item.type === "pest" || item.type === "unknown"
      ? item.type
      : "unknown";

  return {
    id: item.id,
    timestamp: item.timestamp,
    diagnosis: item.diagnosis,
    confidence: Math.max(0, Math.min(1, item.confidence)),
    type,
    imageUri,
    crop: typeof item.crop === "string" ? item.crop : undefined,
    classId: typeof item.classId === "string" ? item.classId : undefined,
    isAmbiguous:
      typeof item.isAmbiguous === "boolean" ? item.isAmbiguous : undefined,
    result: result && imageUri ? { ...result, imageUri } : undefined,
  };
}

export function parseStoredHistory(raw: string | null): ScanHistoryItem[] {
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    const candidates = Array.isArray(parsed)
      ? parsed
      : parsed &&
          typeof parsed === "object" &&
          (parsed as { version?: unknown }).version === HISTORY_STORAGE_VERSION &&
          Array.isArray((parsed as { items?: unknown }).items)
        ? (parsed as { items: unknown[] }).items
        : [];

    return candidates
      .map(sanitizeHistoryItem)
      .filter((item): item is ScanHistoryItem => item !== null)
      .slice(0, MAX_HISTORY_ITEMS);
  } catch {
    return [];
  }
}

export function serializeHistory(history: ScanHistoryItem[]): string {
  return JSON.stringify({
    version: HISTORY_STORAGE_VERSION,
    items: history,
  });
}

export function createHistoryItem(
  scan: NewScanHistoryItem,
  id: string,
  timestamp: number
): ScanHistoryItem {
  return {
    ...scan,
    // Persist the model observation, not a snapshot of agronomy guidance that
    // may be corrected in a future app release. History rehydrates guidance
    // from the currently installed, reviewed treatment map.
    result: scan.result ? { ...scan.result, treatment: null } : undefined,
    id,
    timestamp,
  };
}

export function prependHistory(
  current: ScanHistoryItem[],
  next: ScanHistoryItem
): { history: ScanHistoryItem[]; removed: ScanHistoryItem[] } {
  const combined = [next, ...current];
  return {
    history: combined.slice(0, MAX_HISTORY_ITEMS),
    removed: combined.slice(MAX_HISTORY_ITEMS),
  };
}
