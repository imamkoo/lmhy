import assert from "node:assert/strict";
import { test } from "node:test";
import type { MitraDraft } from "@/lib/mitra/application-schema";
import {
  evaluateMemberSubmission,
  evaluateSubmission,
} from "@/lib/mitra/submit";

function validDraft(): MitraDraft {
  return {
    track: "KLINIS",
    applicantName: "Budi Santoso",
    applicantEmail: "budi@contoh.id",
    whatsapp: "081234567890",
    domicileProvince: "DKI Jakarta",
    domicileCity: "Jakarta Selatan",
    username: "budi-santoso",
    password: "rahasia123",
    academicTitle: "M.Psi",
    s2Campus: "Universitas Indonesia",
    s2GraduationYear: 2020,
    specialization: "Umum",
    strNumber: "STR123",
    sipStatus: "AKTIF",
    currentPractice: "Klinik",
    yearsExperience: "5 tahun",
    flightHours: "",
    modalities: ["VIDEO"],
    motivation: "a".repeat(200),
    ethicsAccepted: true,
    dataAccuracyAccepted: true,
  };
}

test("email existing menghasilkan EMAIL_EXISTS", () => {
  const r = evaluateSubmission({
    existingEmails: ["budi@contoh.id"],
    draft: validDraft(),
    existingUsernames: [],
    rateLimited: false,
    activeForEmail: 0,
  });
  assert.equal(r.ok, false);
  assert.equal(r.code, "EMAIL_EXISTS");
});
test("rate limit menghasilkan RATE_LIMITED", () =>
  assert.equal(
    evaluateSubmission({
      existingEmails: [],
      draft: validDraft(),
      existingUsernames: [],
      rateLimited: true,
      activeForEmail: 0,
    }).code,
    "RATE_LIMITED",
  ));
test("username bentrok menghasilkan USERNAME_TAKEN + saran", () => {
  const r = evaluateSubmission({
    existingEmails: [],
    draft: validDraft(),
    existingUsernames: ["budi-santoso"],
    rateLimited: false,
    activeForEmail: 0,
  });
  assert.equal(r.code, "USERNAME_TAKEN");
  assert.equal(r.suggestions?.length, 3);
});
test("validasi gagal menghasilkan VALIDATION_FAILED + issues", () => {
  const r = evaluateSubmission({
    existingEmails: [],
    draft: { ...validDraft(), applicantName: "" },
    existingUsernames: [],
    rateLimited: false,
    activeForEmail: 0,
  });
  assert.equal(r.code, "VALIDATION_FAILED");
  assert.ok(r.issues?.length);
});
test("draft valid lolos ke langkah pembuatan akun", () =>
  assert.equal(
    evaluateSubmission({
      existingEmails: [],
      draft: validDraft(),
      existingUsernames: [],
      rateLimited: false,
      activeForEmail: 0,
    }).ok,
    true,
  ));

test("member dapat mempertahankan username miliknya sendiri", () => {
  const draft = {
    ...validDraft(),
    applicantEmail: "member@contoh.id",
    username: "member",
  };
  const result = evaluateMemberSubmission({
    draft,
    sessionEmail: "member@contoh.id",
    ownUsername: "member",
    hasPendingApplication: false,
  });
  assert.equal(result.ok, true);
  assert.equal(result.code, "OK");
});

test("member dengan pengajuan pending ditolak", () => {
  const result = evaluateMemberSubmission({
    draft: { ...validDraft(), applicantEmail: "member@contoh.id" },
    sessionEmail: "member@contoh.id",
    ownUsername: "budi-santoso",
    hasPendingApplication: true,
  });
  assert.equal(result.code, "ACTIVE_APPLICATION");
  assert.match(result.message ?? "", /sudah memiliki pengajuan/);
});

test("member dengan email berbeda ditolak", () => {
  const result = evaluateMemberSubmission({
    draft: { ...validDraft(), applicantEmail: "other@contoh.id" },
    sessionEmail: "member@contoh.id",
    ownUsername: "budi-santoso",
    hasPendingApplication: false,
  });
  assert.equal(result.code, "EMAIL_MISMATCH");
  assert.match(result.message ?? "", /Email harus sama/);
});
