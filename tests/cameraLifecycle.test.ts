import assert from "node:assert/strict";
import test from "node:test";
import { shouldActivateCamera } from "../src/lib/cameraLifecycle";

test("activates the camera only on a visible, active, idle scan screen", () => {
  assert.equal(shouldActivateCamera(true, "active", false), true);
  assert.equal(shouldActivateCamera(false, "active", false), false);
  assert.equal(shouldActivateCamera(true, "background", false), false);
  assert.equal(shouldActivateCamera(true, "inactive", false), false);
  assert.equal(shouldActivateCamera(true, "active", true), false);
});
