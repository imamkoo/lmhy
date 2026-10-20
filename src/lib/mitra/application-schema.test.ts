import test from "node:test";
import assert from "node:assert/strict";
import {
  validateMitraDraft,
  validatePsikologDraft,
  validatePendampingDraft,
} from "./application-schema";
import {
  pendampingValidFixture,
  psikologValidFixture,
} from "./__fixtures__/mitra-draft";

test("psikolog: field wajib hilang menghasilkan issue per field", () => {
  const issues = validatePsikologDraft({
    track: "KLINIS",
    applicantName: "",
    applicantEmail: "",
    whatsapp: "",
    domicileProvince: "",
    domicileCity: "",
    username: "",
    password: "",
    academicTitle: "",
    s2Campus: "",
    s2GraduationYear: 0,
    specialization: "",
    strNumber: "",
    sipStatus: "AKTIF",
    currentPractice: "",
    yearsExperience: "",
    flightHours: "",
    modalities: [],
    motivation: "",
    ethicsAccepted: false,
    dataAccuracyAccepted: false,
  });
  const fields = issues.map((i) => i.field);
  for (const f of [
    "applicantName",
    "applicantEmail",
    "whatsapp",
    "domicileProvince",
    "domicileCity",
    "username",
    "password",
    "academicTitle",
    "s2Campus",
    "s2GraduationYear",
    "specialization",
    "strNumber",
    "currentPractice",
    "yearsExperience",
    "modalities",
    "motivation",
    "ethicsAccepted",
    "dataAccuracyAccepted",
  ]) {
    assert.ok(fields.includes(f), `missing issue for ${f}`);
  }
});

test("psikolog: password minimal 8 karakter dan honeypot terisi ditolak", () => {
  const shortPass = validatePsikologDraft({
    ...psikologValidFixture(),
    password: "abc",
  });
  assert.ok(shortPass.some((i) => i.field === "password"));

  const honeypot = validatePsikologDraft({
    ...psikologValidFixture(),
    honeypot: "bot-value",
  });
  assert.ok(honeypot.some((i) => i.field === "honeypot"));
});

test("psikolog: modalitas minimal satu dan harus dari VIDEO/VOICE/CHAT", () => {
  const emptyMod = validatePsikologDraft({
    ...psikologValidFixture(),
    modalities: [],
  });
  assert.ok(emptyMod.some((i) => i.field === "modalities"));

  const invalidMod = validatePsikologDraft({
    ...psikologValidFixture(),
    modalities: ["IN_PERSON"],
  });
  assert.ok(invalidMod.some((i) => i.field === "modalities"));
});

test("psikolog: tahun lulus di luar rentang ditolak", () => {
  const tooOld = validatePsikologDraft({
    ...psikologValidFixture(),
    s2GraduationYear: 1979,
  });
  assert.ok(tooOld.some((i) => i.field === "s2GraduationYear"));

  const future = validatePsikologDraft(
    {
      ...psikologValidFixture(),
      s2GraduationYear: 2099,
    },
    new Date("2026-10-20T00:00:00.000Z")
  );
  assert.ok(future.some((i) => i.field === "s2GraduationYear"));
});

test("pendamping: backgroundTrack wajib dan dari daftar tetap", () => {
  const invalid = validatePendampingDraft({
    ...pendampingValidFixture(),
    backgroundTrack: "LAIN" as unknown as "PENYINTAS",
  });
  assert.ok(invalid.some((i) => i.field === "backgroundTrack"));
});

test("pendamping: WA group & PFA commitment wajib dicentang", () => {
  const noWaGroup = validatePendampingDraft({
    ...pendampingValidFixture(),
    waGroupConfirmed: false,
  });
  assert.ok(noWaGroup.some((i) => i.field === "waGroupConfirmed"));

  const noPfa = validatePendampingDraft({
    ...pendampingValidFixture(),
    pfaCommitment: false,
  });
  assert.ok(noPfa.some((i) => i.field === "pfaCommitment"));
});

test("motivasi minimal 200 karakter untuk kedua track", () => {
  const shortPsikolog = validatePsikologDraft({
    ...psikologValidFixture(),
    motivation: "terlalu pendek",
  });
  assert.ok(shortPsikolog.some((i) => i.field === "motivation"));

  const shortPendamping = validatePendampingDraft({
    ...pendampingValidFixture(),
    motivation: "terlalu pendek",
  });
  assert.ok(shortPendamping.some((i) => i.field === "motivation"));
});

test("honeypot terisi menghasilkan issue honeypot", () => {
  const r = validateMitraDraft({
    ...psikologValidFixture(),
    honeypot: "spam",
  });
  assert.equal(r.ok, false);
  assert.ok(r.issues.some((i) => i.field === "honeypot"));
});

test("formElapsedMs di bawah 5000 menghasilkan issue formElapsedMs", () => {
  const r = validateMitraDraft({
    ...psikologValidFixture(),
    formElapsedMs: 2500,
  });
  assert.equal(r.ok, false);
  assert.ok(r.issues.some((i) => i.field === "formElapsedMs"));
});

test("normalize menghasilkan details sesuai track", () => {
  const r = validateMitraDraft(psikologValidFixture());
  assert.equal(r.ok, true);
  assert.equal(r.normalized?.details.academic_title, "S.Psi");
  assert.equal(r.normalized?.details.sip_status, "AKTIF");
  assert.ok(Array.isArray(r.normalized?.details.modalities));

  const p = validateMitraDraft(pendampingValidFixture());
  assert.equal(p.ok, true);
  assert.equal(p.normalized?.details.background_track, "PENYINTAS");
  assert.equal(p.normalized?.details.wa_group_confirmed, true);
});

test("email sekali pakai (disposable) ditolak", () => {
  const r = validatePsikologDraft({
    ...psikologValidFixture(),
    applicantEmail: "test@mailinator.com",
  });
  assert.ok(r.some((i) => i.field === "applicantEmail"));
});
