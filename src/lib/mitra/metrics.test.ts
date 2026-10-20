import { test } from "node:test";
import assert from "node:assert/strict";
import { medianReviewHours } from "./metrics";

test("medianReviewHours mengembalikan null bila tidak ada data", () => {
  assert.equal(medianReviewHours([]), null);
});

test("medianReviewHours menghitung median selisih jam", () => {
  const rows = [
    { applied_at: "2026-10-01T00:00:00Z", decided_at: "2026-10-01T02:00:00Z" },
    { applied_at: "2026-10-01T00:00:00Z", decided_at: "2026-10-01T04:00:00Z" },
    { applied_at: "2026-10-01T00:00:00Z", decided_at: "2026-10-01T10:00:00Z" },
  ];
  assert.equal(medianReviewHours(rows), 4);
});

test("baris tanpa decided_at diabaikan", () => {
  assert.equal(medianReviewHours([{ applied_at: "2026-10-01T00:00:00Z", decided_at: null }]), null);
});
