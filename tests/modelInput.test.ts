import assert from "node:assert/strict";
import test from "node:test";
import type { TensorflowModel } from "react-native-fast-tflite";
import {
  hasExpectedModelInput,
  MODEL_INPUT_VALUE_COUNT,
  rgbBytesToModelInput,
} from "../src/lib/modelInput";

test("converts RGB bytes to float32 without normalizing twice", () => {
  const rgb = new Uint8Array(MODEL_INPUT_VALUE_COUNT);
  rgb[0] = 0;
  rgb[1] = 127;
  rgb[2] = 255;

  const input = rgbBytesToModelInput(rgb);

  assert.ok(input instanceof Float32Array);
  assert.equal(input.length, MODEL_INPUT_VALUE_COUNT);
  assert.deepEqual(Array.from(input.slice(0, 3)), [0, 127, 255]);
});

test("rejects buffers that do not match the model shape", () => {
  assert.throws(() => rgbBytesToModelInput(new Uint8Array(3)), /Expected 150528/);
});

test("accepts only the bundled model input contract", () => {
  const model = {
    inputs: [{ name: "input", dataType: "float32", shape: [1, 224, 224, 3] }],
  } as TensorflowModel;
  const wrongType = {
    inputs: [{ name: "input", dataType: "uint8", shape: [1, 224, 224, 3] }],
  } as TensorflowModel;

  assert.equal(hasExpectedModelInput(model), true);
  assert.equal(hasExpectedModelInput(wrongType), false);
});
