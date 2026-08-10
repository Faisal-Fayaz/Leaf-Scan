import jpeg from "jpeg-js";
import type { TensorflowModel } from "react-native-fast-tflite";
import type { Prediction, ScanMode } from "@/types";
import { predictionFromOutputs } from "@/lib/prediction";

export const MODEL_INPUT_SIZE = 224;

export function jpegToRgb(arrayBuffer: ArrayBuffer): Uint8Array {
  const decoded = jpeg.decode(arrayBuffer, { useTArray: true });
  const expectedPixels = decoded.width * decoded.height;
  const rgba = decoded.data;
  const rgb = new Uint8Array(expectedPixels * 3);

  for (let pixel = 0; pixel < expectedPixels; pixel += 1) {
    const source = pixel * 4;
    const target = pixel * 3;
    rgb[target] = rgba[source] ?? 0;
    rgb[target + 1] = rgba[source + 1] ?? 0;
    rgb[target + 2] = rgba[source + 2] ?? 0;
  }

  return rgb;
}

export function runStaticPrediction(
  model: TensorflowModel | undefined,
  imageBuffer: ArrayBuffer,
  classNames: string[],
  mode: ScanMode
): Prediction | null {
  if (!model || classNames.length === 0) return null;

  const input = jpegToRgb(imageBuffer);
  const outputs = model.runSync([input]);
  return predictionFromOutputs(outputs, classNames, mode);
}
