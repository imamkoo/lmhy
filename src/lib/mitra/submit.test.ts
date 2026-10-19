import assert from "node:assert/strict";
import { test } from "node:test";
import type { MitraDraft } from "@/lib/mitra/application-schema";
import { evaluateSubmission } from "@/lib/mitra/submit";

function validDraft(): MitraDraft {
  return {
    track: "KLINIS", applicantName: "Budi Santoso", applicantEmail: "budi@contoh.id", whatsapp: "081234567890",
    domicileProvince: "DKI Jakarta", domicileCity: "Jakarta Selatan", username: "budi-santoso", password: "rahasia123",
    academicTitle: "M.Psi", s2Campus: "Universitas Indonesia", s2GraduationYear: 2020, specialization: "Umum",
    strNumber: "STR123", sipStatus: "AKTIF", currentPractice: "Klinik", yearsExperience: "5 tahun", flightHours: "",
    modalities: ["VIDEO"], motivation: "a".repeat(200), ethicsAccepted: true, dataAccuracyAccepted: true,
  };
}

test("email existing menghasilkan EMAIL_EXISTS", () => {
  const r = evaluateSubmission({ existingEmails: ["budi@contoh.id"], draft: validDraft(), existingUsernames: [], rateLimited: false, activeForEmail: 0 });
  assert.equal(r.ok, false); assert.equal(r.code, "EMAIL_EXISTS");
});
test("rate limit menghasilkan RATE_LIMITED", () => assert.equal(evaluateSubmission({ existingEmails: [], draft: validDraft(), existingUsernames: [], rateLimited: true, activeForEmail: 0 }).code, "RATE_LIMITED"));
test("username bentrok menghasilkan USERNAME_TAKEN + saran", () => { const r = evaluateSubmission({ existingEmails: [], draft: validDraft(), existingUsernames: ["budi-santoso"], rateLimited: false, activeForEmail: 0 }); assert.equal(r.code, "USERNAME_TAKEN"); assert.equal(r.suggestions?.length, 3); });
test("validasi gagal menghasilkan VALIDATION_FAILED + issues", () => { const r = evaluateSubmission({ existingEmails: [], draft: { ...validDraft(), applicantName: "" }, existingUsernames: [], rateLimited: false, activeForEmail: 0 }); assert.equal(r.code, "VALIDATION_FAILED"); assert.ok(r.issues?.length); });
test("draft valid lolos ke langkah pembuatan akun", () => assert.equal(evaluateSubmission({ existingEmails: [], draft: validDraft(), existingUsernames: [], rateLimited: false, activeForEmail: 0 }).ok, true));
