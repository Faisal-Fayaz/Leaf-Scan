import type { Prediction, ScanMode } from "@/types";

const MIN_SCORE = 0.000001;

function asNumericArray(output: unknown): number[] | null {
  if (output instanceof Float32Array || output instanceof Uint8Array || output instanceof Int8Array) {
    return Array.from(output);
  }
  if (ArrayBuffer.isView(output)) {
    return Array.from(output as unknown as ArrayLike<number>);
  }
  if (Array.isArray(output)) {
    return output.map(Number);
  }
  return null;
}

function selectOutput(outputs: unknown[], classCount: number): number[] | null {
  const candidates = outputs
    .map(asNumericArray)
    .filter((candidate): candidate is number[] => candidate !== null && candidate.length > 0);

  // Never silently clamp a model output to the last class. A shape mismatch
  // means the class mapping is unsafe and should be surfaced to the user.
  return candidates.find((candidate) => candidate.length === classCount) ?? null;
}

function toProbabilities(values: number[]): number[] {
  const finite = values.map((value) => (Number.isFinite(value) ? value : 0));
  const max = Math.max(...finite);
  const min = Math.min(...finite);
  const sum = finite.reduce((total, value) => total + Math.max(value, 0), 0);

  if (min >= 0 && max <= 1 && sum > MIN_SCORE) {
    return finite.map((value) => Math.max(value, 0) / sum);
  }

  // If the converter returned logits, calculate a stable softmax so the
  // displayed confidence remains meaningful instead of showing raw logits.
  const exponents = finite.map((value) => Math.exp(value - max));
  const exponentSum = exponents.reduce((total, value) => total + value, 0);
  return exponents.map((value) => value / exponentSum);
}

export function predictionFromOutputs(
  outputs: unknown[],
  classNames: string[],
  mode: ScanMode
): Prediction | null {
  const values = selectOutput(outputs, classNames.length);
  if (!values) return null;

  const scores = toProbabilities(values);
  let bestIndex = 0;
  let secondBest = 0;

  for (let index = 1; index < scores.length; index += 1) {
    if (scores[index] > scores[bestIndex]) {
      secondBest = bestIndex;
      bestIndex = index;
    } else if (scores[index] > scores[secondBest] || secondBest === bestIndex) {
      secondBest = index;
    }
  }

  const confidence = scores[bestIndex] ?? 0;
  const margin = confidence - (scores[secondBest] ?? 0);
  const label = classNames[bestIndex];

  if (!label || !Number.isFinite(confidence)) return null;

  return {
    classId: label,
    label,
    confidence,
    margin,
    mode,
  };
}
