import assert from "node:assert/strict";
import test from "node:test";
import {
  createHistoryItem,
  HISTORY_STORAGE_VERSION,
  MAX_HISTORY_ITEMS,
  parseStoredHistory,
  prependHistory,
  serializeHistory,
  type NewScanHistoryItem,
  type ScanHistoryItem,
} from "../src/lib/history";
import type { ScanResult } from "../src/types";

const result: ScanResult = {
  imageUri: "file:///cache/leaf.jpg",
  topPrediction: {
    classId: "Tomato___Late_blight",
    label: "Tomato___Late_blight",
    confidence: 0.84,
    margin: 0.22,
    mode: "disease",
  },
  alternativePredictions: [],
  treatment: {
    classId: "Tomato___Late_blight",
    displayName: "Tomato late blight",
    crop: "Tomato",
    description: "A possible visual match.",
    organicTreatment: ["Remove badly affected material."],
    chemicalTreatment: [],
    severity: "moderate",
  },
  isLowConfidence: false,
  isAmbiguous: false,
  source: "camera",
};

const newScan: NewScanHistoryItem = {
  imageUri: result.imageUri,
  diagnosis: "Possible Tomato late blight",
  confidence: 0.84,
  type: "disease",
  crop: "Tomato",
  classId: result.topPrediction.classId,
  isAmbiguous: false,
  result,
};

test("round-trips versioned history with a reviewable result", () => {
  const item = createHistoryItem(newScan, "scan-1", 1_700_000_000_000);
  const encoded = serializeHistory([item]);
  const parsed = parseStoredHistory(encoded);

  assert.equal(JSON.parse(encoded).version, HISTORY_STORAGE_VERSION);
  assert.deepEqual(parsed, [item]);
  assert.equal(parsed[0]?.result?.treatment, null);
});

test("migrates the legacy array format and rejects malformed entries", () => {
  const legacy = JSON.stringify([
    {
      id: "legacy-1",
      timestamp: 1_700_000_000_000,
      diagnosis: "Uncertain scan",
      confidence: 4,
      type: "unexpected",
      imageUri: "file:///cache/legacy.jpg",
    },
    { id: "broken" },
  ]);

  const parsed = parseStoredHistory(legacy);

  assert.equal(parsed.length, 1);
  assert.equal(parsed[0]?.confidence, 1);
  assert.equal(parsed[0]?.type, "unknown");
  assert.equal(parsed[0]?.result, undefined);
});

test("drops malformed nested results instead of reopening unsafe data", () => {
  const item = createHistoryItem(newScan, "scan-2", 1_700_000_000_001);
  const stored = JSON.stringify({
    version: HISTORY_STORAGE_VERSION,
    items: [{ ...item, result: { ...result, topPrediction: { confidence: "high" } } }],
  });

  const [parsed] = parseStoredHistory(stored);

  assert.equal(parsed?.diagnosis, item.diagnosis);
  assert.equal(parsed?.result, undefined);
});

test("keeps only the newest bounded set of scans", () => {
  const current: ScanHistoryItem[] = Array.from(
    { length: MAX_HISTORY_ITEMS },
    (_, index) => createHistoryItem(newScan, `old-${index}`, index)
  );
  const next = createHistoryItem(newScan, "newest", MAX_HISTORY_ITEMS + 1);

  const updated = prependHistory(current, next);

  assert.equal(updated.history.length, MAX_HISTORY_ITEMS);
  assert.equal(updated.history[0]?.id, "newest");
  assert.deepEqual(updated.removed.map((item) => item.id), ["old-49"]);
});
