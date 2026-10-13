import test from "node:test";
import assert from "node:assert/strict";
import { resolveTakeRateBps, TAKE_RATE_FLAT_BPS, TAKE_RATE_FREE_BPS } from "./take-rate";

test("TAKE_RATE_FLAT_BPS is 1000 (10% flat)", () => {
  assert.equal(TAKE_RATE_FLAT_BPS, 1000);
});

test("all tiers SAPA, CERITA, DENGAR resolve to flat 1000", () => {
  assert.equal(resolveTakeRateBps("SAPA"), 1000);
  assert.equal(resolveTakeRateBps("CERITA"), 1000);
  assert.equal(resolveTakeRateBps("DENGAR"), 1000);
});

test("null, undefined, empty and unknown tiers resolve to flat 1000", () => {
  assert.equal(resolveTakeRateBps(null), 1000);
  assert.equal(resolveTakeRateBps(undefined), 1000);
  assert.equal(resolveTakeRateBps(""), 1000);
  assert.equal(resolveTakeRateBps("unknown"), 1000);
});

test("legacy FREE/PRO tiers also resolve to flat 1000 (backward compat)", () => {
  assert.equal(resolveTakeRateBps("FREE"), 1000);
  assert.equal(resolveTakeRateBps("PRO"), 1000);
});

test("backward compat aliases equal 1000", () => {
  assert.equal(TAKE_RATE_FREE_BPS, 1000);
});
