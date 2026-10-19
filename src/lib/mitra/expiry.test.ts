import test from "node:test";
import assert from "node:assert/strict";
import {
  isEmailVerificationExpired,
  isApplicationExpired,
  documentPurgeAfter,
  tombstoneUsername,
  isSlaOverdue,
} from "./expiry";

test("verifikasi email kedaluwarsa setelah 7 hari", () => {
  const applied = new Date("2026-10-01T00:00:00.000Z");
  assert.equal(isEmailVerificationExpired(applied, new Date("2026-10-07T23:59:59.000Z")), false);
  assert.equal(isEmailVerificationExpired(applied, new Date("2026-10-08T00:00:01.000Z")), true);
});

test("pengajuan kedaluwarsa setelah 30 hari", () => {
  const applied = new Date("2026-10-01T00:00:00.000Z");
  assert.equal(isApplicationExpired(applied, new Date("2026-10-30T23:59:59.000Z")), false);
  assert.equal(isApplicationExpired(applied, new Date("2026-10-31T00:00:01.000Z")), true);
});

test("purge dokumen 90 hari setelah keputusan", () => {
  assert.equal(documentPurgeAfter(new Date("2026-10-01T00:00:00.000Z")).toISOString(), "2026-12-30T00:00:00.000Z");
});

test("tombstone username deterministik dan valid", () => {
  const t = tombstoneUsername("123e4567-e89b-12d3-a456-426614174000");
  assert.match(t, /^akun-[a-f0-9]{8}$/);
  assert.equal(tombstoneUsername("123e4567-e89b-12d3-a456-426614174000"), t);
});

test("SLA 3 hari terlewati terdeteksi", () => {
  const applied = new Date("2026-10-01T00:00:00.000Z");
  assert.equal(isSlaOverdue(applied, new Date("2026-10-03T00:00:00.000Z"), 3), false);
  assert.equal(isSlaOverdue(applied, new Date("2026-10-05T00:00:00.000Z"), 3), true);
});
