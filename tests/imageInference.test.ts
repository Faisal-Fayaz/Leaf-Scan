import assert from "node:assert/strict";
import test from "node:test";
import jpeg from "jpeg-js";
import { jpegToModelInput } from "../src/lib/imageInference";
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
