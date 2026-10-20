import test from "node:test";
import assert from "node:assert/strict";
import {
  canTransitionApplication,
  evaluateApproval,
  evaluateRejection,
  roleForTrack,
  serviceTrackForTrack,
} from "./application-state";

test("hanya PENDING yang bisa diputuskan", () => {
  assert.equal(canTransitionApplication("PENDING", "APPROVED"), true);
  assert.equal(canTransitionApplication("PENDING", "REJECTED"), true);
  assert.equal(canTransitionApplication("APPROVED", "REJECTED"), false);
  assert.equal(canTransitionApplication("REJECTED", "APPROVED"), false);
  assert.equal(canTransitionApplication("EXPIRED", "APPROVED"), false);
  assert.equal(canTransitionApplication("PENDING", "SUPERSEDED"), true);
});

test("approve ditolak bila email belum terverifikasi", () => {
  const r = evaluateApproval({ status: "PENDING", track: "KLINIS", emailVerifiedAt: null, waJoinedConfirmedAt: null, pfaStatus: "BELUM", hasRequiredDocuments: true, adminUserId: "admin-1", applicantUserId: "user-2" });
  assert.equal(r.allowed, false);
  assert.ok(r.reasons.some((x) => x.includes("email")));
});

test("approve SEBAYA butuh WA terverifikasi dan PFA selesai", () => {
  const base = { status: "PENDING" as const, track: "SEBAYA" as const, emailVerifiedAt: new Date().toISOString(), hasRequiredDocuments: true, adminUserId: "admin-1", applicantUserId: "user-2" };
  assert.equal(evaluateApproval({ ...base, waJoinedConfirmedAt: null, pfaStatus: "SELESAI" }).allowed, false);
  assert.equal(evaluateApproval({ ...base, waJoinedConfirmedAt: new Date().toISOString(), pfaStatus: "BELUM" }).allowed, false);
  assert.equal(evaluateApproval({ ...base, waJoinedConfirmedAt: new Date().toISOString(), pfaStatus: "SELESAI" }).allowed, true);
});

test("approve KLINIS tidak butuh WA/PFA tetapi butuh dokumen", () => {
  const base = { status: "PENDING" as const, track: "KLINIS" as const, emailVerifiedAt: new Date().toISOString(), waJoinedConfirmedAt: null, pfaStatus: "BELUM" as const, adminUserId: "admin-1", applicantUserId: "user-2" };
  assert.equal(evaluateApproval({ ...base, hasRequiredDocuments: true }).allowed, true);
  assert.equal(evaluateApproval({ ...base, hasRequiredDocuments: false }).allowed, false);
});

test("admin tidak boleh approve pengajuannya sendiri", () => {
  const r = evaluateApproval({ status: "PENDING", track: "KLINIS", emailVerifiedAt: new Date().toISOString(), waJoinedConfirmedAt: null, pfaStatus: "BELUM", hasRequiredDocuments: true, adminUserId: "same-id", applicantUserId: "same-id" });
  assert.equal(r.allowed, false);
});

test("gate approve menolak pengajuan yang sudah diputuskan", () => {
  const r = evaluateApproval({
    status: "APPROVED",
    track: "KLINIS",
    emailVerifiedAt: new Date().toISOString(),
    waJoinedConfirmedAt: null,
    pfaStatus: "BELUM",
    hasRequiredDocuments: true,
    adminUserId: "a",
    applicantUserId: "u",
  });
  assert.equal(r.allowed, false);
});

test("reject wajib menyertakan catatan dan tidak boleh oleh pelamar sendiri", () => {
  assert.equal(evaluateRejection({ status: "PENDING", note: "", adminUserId: "a", applicantUserId: "u" }).allowed, false);
  assert.equal(evaluateRejection({ status: "PENDING", note: "STR belum aktif", adminUserId: "u", applicantUserId: "u" }).allowed, false);
  assert.equal(evaluateRejection({ status: "PENDING", note: "STR belum aktif", adminUserId: "a", applicantUserId: "u" }).allowed, true);
  assert.equal(evaluateRejection({ status: "APPROVED", note: "x", adminUserId: "a", applicantUserId: "u" }).allowed, false);
});

test("pemetaan track ke role dan service track", () => {
  assert.equal(roleForTrack("SEBAYA"), "PENDAMPING");
  assert.equal(roleForTrack("KLINIS"), "PRAKTISI");
  assert.equal(serviceTrackForTrack("SEBAYA"), "SEBAYA");
  assert.equal(serviceTrackForTrack("KLINIS"), "KLINIS");
});
