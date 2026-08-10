import assert from "node:assert/strict";
import test from "node:test";
import { centeredSquareCrop } from "../src/lib/imageGeometry";

test("center-crops landscape images", () => {
  assert.deepEqual(centeredSquareCrop(1600, 1200), {
    originX: 200,
    originY: 0,
    width: 1200,
    height: 1200,
  });
});

test("center-crops portrait images", () => {
  assert.deepEqual(centeredSquareCrop(900, 1200), {
    originX: 0,
    originY: 150,
    width: 900,
    height: 900,
  });
});

test("rejects invalid dimensions", () => {
  assert.throws(() => centeredSquareCrop(0, 1200), /Invalid image dimensions/);
});
