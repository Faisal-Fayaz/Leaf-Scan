import assert from "node:assert/strict";
import test from "node:test";
import { languageFromTags, translate } from "../src/i18n/core";
import { en, hi } from "../src/i18n/translations";

test("keeps English and Hindi translation catalogs complete", () => {
  assert.deepEqual(Object.keys(hi).sort(), Object.keys(en).sort());
  assert.ok(Object.values(en).every((value) => value.trim().length > 0));
  assert.ok(Object.values(hi).every((value) => value.trim().length > 0));
});

test("interpolates localized values without losing unknown placeholders", () => {
  assert.equal(translate("en", "history.count", { count: 4 }), "4 saved scans");
  assert.equal(translate("hi", "history.count", { count: 4 }), "4 स्कैन सुरक्षित");
  assert.equal(translate("en", "history.count"), "{count} saved scans");
});

test("chooses Hindi for Hindi device locales and English otherwise", () => {
  assert.equal(languageFromTags(["hi-IN", "en-IN"]), "hi");
  assert.equal(languageFromTags(["en-US"]), "en");
  assert.equal(languageFromTags([]), "en");
});
