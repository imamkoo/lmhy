import test from "node:test";
import assert from "node:assert/strict";
import {
  buildVerificationUrl,
  parseVerificationParams,
  safeNextPath,
  selectPendingApplicationsToVerify,
} from "./email-verification";

test("parseVerificationParams menerima token_hash dan type email", () => {
  const params = new URLSearchParams("token_hash=abc123&type=email");
  assert.deepEqual(parseVerificationParams(params), {
    tokenHash: "abc123",
    type: "email",
  });
});

test("parseVerificationParams menolak type yang tidak dikenal", () => {
  const params = new URLSearchParams("token_hash=abc123&type=evil");
  assert.equal(parseVerificationParams(params), null);
});

test("parseVerificationParams null bila token_hash atau type kosong", () => {
  assert.equal(parseVerificationParams(new URLSearchParams("type=email")), null);
  assert.equal(parseVerificationParams(new URLSearchParams("token_hash=abc")), null);
  assert.equal(
    parseVerificationParams(new URLSearchParams("token_hash=  &type=email")),
    null
  );
});

test("safeNextPath menolak open redirect", () => {
  assert.equal(safeNextPath("https://jahat.example"), "/akun");
  assert.equal(safeNextPath("//jahat.example"), "/akun");
  assert.equal(safeNextPath("jahat.example"), "/akun");
  assert.equal(safeNextPath(null), "/akun");
});

test("safeNextPath menerima path internal", () => {
  assert.equal(safeNextPath("/akun"), "/akun");
  assert.equal(safeNextPath("/akun?tab=pengajuan"), "/akun?tab=pengajuan");
});

test("buildVerificationUrl menghasilkan tautan callback yang membawa session", () => {
  const url = buildVerificationUrl("https://www.letmehearyou.id", "tok123");
  assert.equal(
    url,
    "https://www.letmehearyou.id/auth/callback?token_hash=tok123&type=email&next=%2Fakun"
  );
});

test("buildVerificationUrl tidak menghasilkan double slash", () => {
  const url = buildVerificationUrl("https://www.letmehearyou.id/", "tok123");
  assert.ok(url.startsWith("https://www.letmehearyou.id/auth/callback?"));
});

test("selectPendingApplicationsToVerify hanya ambil PENDING yang belum terverifikasi", () => {
  const ids = selectPendingApplicationsToVerify([
    { id: "a", applied_at: "2026-10-01T00:00:00Z", status: "PENDING", email_verified_at: null },
    { id: "b", applied_at: "2026-10-01T00:00:00Z", status: "PENDING", email_verified_at: "2026-10-02T00:00:00Z" },
    { id: "c", applied_at: "2026-10-01T00:00:00Z", status: "APPROVED", email_verified_at: null },
    { id: "d", applied_at: "2026-10-01T00:00:00Z", status: "PENDING", email_verified_at: null },
  ]);
  assert.deepEqual(ids, ["a", "d"]);
});

test("parseVerificationParams menerima type recovery untuk reset kata sandi", () => {
  const params = new URLSearchParams("token_hash=abc123&type=recovery&next=%2Freset-password");
  assert.deepEqual(parseVerificationParams(params), {
    tokenHash: "abc123",
    type: "recovery",
  });
});

test("type recovery tetap ditolak bila token_hash kosong", () => {
  assert.equal(parseVerificationParams(new URLSearchParams("type=recovery")), null);
});
