import assert from "node:assert/strict";
import test from "node:test";
import jpeg from "jpeg-js";
import type { TensorflowModel } from "react-native-fast-tflite";
import { jpegToModelInput, runModelPrediction } from "../src/lib/imageInference";
import { MODEL_INPUT_VALUE_COUNT } from "../src/lib/modelInput";

function createJpeg(width: number, height: number): ArrayBuffer {
  const data = new Uint8Array(width * height * 4);
  for (let pixel = 0; pixel < width * height; pixel += 1) {
    const offset = pixel * 4;
    data[offset] = 32;
    data[offset + 1] = 128;
    data[offset + 2] = 224;
    data[offset + 3] = 255;
  }

  return new Uint8Array(jpeg.encode({ width, height, data }, 100).data).buffer;
}

test("decodes a model-sized JPEG to float32 values in the 0-255 range", () => {
  const input = jpegToModelInput(createJpeg(224, 224));

  assert.ok(input instanceof Float32Array);
  assert.equal(input.length, MODEL_INPUT_VALUE_COUNT);
  assert.ok(input[0] > 20);
  assert.ok(input[1] > 100);
  assert.ok(input[2] > 200);
});

test("rejects JPEGs that skipped square resize preprocessing", () => {
  assert.throws(() => jpegToModelInput(createJpeg(160, 120)), /Expected a 224x224 image/);
});

test("passes ArrayBuffers to Nitro TFLite and decodes its float output", () => {
  const input = new Float32Array(MODEL_INPUT_VALUE_COUNT);
  let receivedInput: ArrayBuffer | undefined;
  const model = {
    inputs: [{ name: "input", dataType: "float32", shape: [1, 224, 224, 3] }],
    outputs: [{ name: "scores", dataType: "float32", shape: [1, 2] }],
    runSync: (buffers: ArrayBuffer[]) => {
      [receivedInput] = buffers;
      return [new Float32Array([0.2, 0.8]).buffer];
    },
  } as unknown as TensorflowModel;

  const prediction = runModelPrediction(model, input, ["healthy", "leaf_spot"], "disease");

  assert.equal(receivedInput, input.buffer);
  assert.equal(prediction?.label, "leaf_spot");
  assert.ok(Math.abs((prediction?.confidence ?? 0) - 0.8) < 0.000001);
});
