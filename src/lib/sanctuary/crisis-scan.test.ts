import test from "node:test";
import assert from "node:assert/strict";
import { scanForCrisis } from "./crisis-scan";

test("flags direct self-harm ideation", () => {
  const result = scanForCrisis("aku pengen bunuh diri");
  assert.equal(result.flagged, true);
  assert.ok(result.matched.length > 0);
});

test("flags evasive spacing and casing", () => {
  assert.equal(scanForCrisis("BUNUH   DIRI").flagged, true);
  assert.equal(scanForCrisis("ingin  mengakhiri hidup").flagged, true);
});

test("flags English variants", () => {
  assert.equal(scanForCrisis("i want to kill myself").flagged, true);
});

test("does not flag ordinary distress", () => {
  assert.equal(scanForCrisis("aku capek banget dan sedih akhir-akhir ini").flagged, false);
  assert.equal(scanForCrisis("").flagged, false);
  assert.equal(scanForCrisis(null).flagged, false);
  assert.equal(scanForCrisis(undefined).flagged, false);
});
