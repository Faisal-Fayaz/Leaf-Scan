import jpeg from "jpeg-js";
import type { TensorflowModel } from "react-native-fast-tflite";
import type { Prediction, ScanMode } from "@/types";
import { predictionFromOutputs } from "@/lib/prediction";
import {
  assertExpectedModelInput,
  MODEL_INPUT_HEIGHT,
  MODEL_INPUT_VALUE_COUNT,
  MODEL_INPUT_WIDTH,
} from "@/lib/modelInput";

export function jpegToModelInput(arrayBuffer: ArrayBuffer): Float32Array {
  const decoded = jpeg.decode(arrayBuffer, { useTArray: true });
  if (decoded.width !== MODEL_INPUT_WIDTH || decoded.height !== MODEL_INPUT_HEIGHT) {
    throw new Error(
      `Expected a ${MODEL_INPUT_WIDTH}x${MODEL_INPUT_HEIGHT} image, received ${decoded.width}x${decoded.height}`
    );
  }

  const expectedPixels = MODEL_INPUT_WIDTH * MODEL_INPUT_HEIGHT;
  const rgba = decoded.data;
  const input = new Float32Array(MODEL_INPUT_VALUE_COUNT);

  for (let pixel = 0; pixel < expectedPixels; pixel += 1) {
    const source = pixel * 4;
    const target = pixel * 3;
    input[target] = rgba[source] ?? 0;
    input[target + 1] = rgba[source + 1] ?? 0;
    input[target + 2] = rgba[source + 2] ?? 0;
  }

  return input;
}

export function runModelPrediction(
  model: TensorflowModel | undefined,
  input: Float32Array,
  classNames: string[],
  mode: ScanMode
): Prediction | null {
  if (!model || classNames.length === 0) return null;

  assertExpectedModelInput(model);
  if (input.length !== MODEL_INPUT_VALUE_COUNT) {
    throw new Error(
      `Expected ${MODEL_INPUT_VALUE_COUNT} model input values, received ${input.length}`
    );
  }

  const outputs = model.runSync([input.buffer as ArrayBuffer]);
  const typedOutputs = outputs.map((output, index) => {
    switch (model.outputs[index]?.dataType) {
      case "float32":
        return new Float32Array(output);
      case "float64":
        return new Float64Array(output);
      case "int8":
        return new Int8Array(output);
      case "int16":
        return new Int16Array(output);
      case "int32":
        return new Int32Array(output);
      case "uint8":
        return new Uint8Array(output);
      case "uint16":
        return new Uint16Array(output);
      case "uint32":
        return new Uint32Array(output);
      default:
        return output;
    }
  });
  return predictionFromOutputs(typedOutputs, classNames, mode);
}
