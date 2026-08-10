import type { TensorflowModel } from "react-native-fast-tflite";

export const MODEL_INPUT_WIDTH = 224;
export const MODEL_INPUT_HEIGHT = 224;
export const MODEL_INPUT_CHANNELS = 3;
export const MODEL_INPUT_VALUE_COUNT =
  MODEL_INPUT_WIDTH * MODEL_INPUT_HEIGHT * MODEL_INPUT_CHANNELS;

/**
 * Both bundled MobileNetV2 models accept float32 pixels in the 0-255 range.
 * Their first two graph operations apply `pixel / 127.5 - 1`, so normalizing
 * the pixels to 0-1 here would apply preprocessing twice and corrupt results.
 */
export function rgbBytesToModelInput(rgb: Uint8Array): Float32Array {
  "worklet";

  if (rgb.length !== MODEL_INPUT_VALUE_COUNT) {
    throw new Error(
      `Expected ${MODEL_INPUT_VALUE_COUNT} RGB values, received ${rgb.length}`
    );
  }

  const input = new Float32Array(rgb.length);
  for (let index = 0; index < rgb.length; index += 1) {
    input[index] = rgb[index];
  }
  return input;
}

export function hasExpectedModelInput(model: TensorflowModel): boolean {
  "worklet";

  const input = model.inputs[0];
  return (
    model.inputs.length === 1 &&
    input?.dataType === "float32" &&
    input.shape.length === 4 &&
    input.shape[0] === 1 &&
    input.shape[1] === MODEL_INPUT_HEIGHT &&
    input.shape[2] === MODEL_INPUT_WIDTH &&
    input.shape[3] === MODEL_INPUT_CHANNELS
  );
}

export function assertExpectedModelInput(model: TensorflowModel): void {
  if (!hasExpectedModelInput(model)) {
    const actual = model.inputs[0];
    const description = actual
      ? `${actual.dataType}[${actual.shape.join(",")}]`
      : "no input tensor";
    throw new Error(
      `Unsupported model input ${description}; expected float32[1,224,224,3]`
    );
  }
}
