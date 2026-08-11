import assert from "node:assert/strict";
import test from "node:test";
import { requireLocalModelUri } from "../src/lib/modelAsset";

test("accepts a materialized file URI for the bundled model", () => {
  const uri = "file:///data/user/0/com.leafscan.app/cache/disease_model.tflite";
  assert.equal(requireLocalModelUri(uri), uri);
});

test("rejects an unresolved Android resource name", () => {
  assert.throws(
    () => requireLocalModelUri("assets_models_disease_model"),
    /not materialized as a local file/
  );
});

test("rejects a missing local model URI", () => {
  assert.throws(
    () => requireLocalModelUri(null),
    /not materialized as a local file/
  );
});
