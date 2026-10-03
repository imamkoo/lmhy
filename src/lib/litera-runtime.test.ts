import test from "node:test";
import assert from "node:assert/strict";
import { getLiteraApiKeyStatus } from "./litera-runtime";

test("classifies an unset or whitespace-only Litera key as missing", () => {
  assert.equal(getLiteraApiKeyStatus(undefined), "MISSING_API_KEY");
  assert.equal(getLiteraApiKeyStatus("   "), "MISSING_API_KEY");
});

test("classifies a non-empty Litera key as configured without returning its value", () => {
  assert.equal(getLiteraApiKeyStatus("lit_sk_example_secret"), "CONFIGURED");
});
