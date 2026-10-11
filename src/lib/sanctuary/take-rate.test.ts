import test from "node:test";
import assert from "node:assert/strict";
import { resolveTakeRateBps, TAKE_RATE_FREE_BPS, TAKE_RATE_PRO_BPS } from "./take-rate";

test("PRO tier resolves to the lower take rate", () => {
  assert.equal(resolveTakeRateBps("PRO"), TAKE_RATE_PRO_BPS);
  assert.equal(TAKE_RATE_PRO_BPS, 500);
});

test("FREE, null, and unknown tiers resolve to the default take rate", () => {
  assert.equal(resolveTakeRateBps("FREE"), TAKE_RATE_FREE_BPS);
  assert.equal(resolveTakeRateBps(null), TAKE_RATE_FREE_BPS);
  assert.equal(resolveTakeRateBps("pro"), TAKE_RATE_FREE_BPS);
  assert.equal(resolveTakeRateBps(undefined), TAKE_RATE_FREE_BPS);
  assert.equal(resolveTakeRateBps(""), TAKE_RATE_FREE_BPS);
  assert.equal(TAKE_RATE_FREE_BPS, 1000);
});
