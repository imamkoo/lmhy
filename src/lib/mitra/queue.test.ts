import test from "node:test";
import assert from "node:assert/strict";
import { computeRedFlags, needsAction } from "./queue";

test("red flag mendeteksi email, WA, PFA, dan STR tidak aktif", () => {
  const flags = computeRedFlags({
    track: "SEBAYA",
    email_verified_at: null,
    wa_joined_confirmed_at: null,
    pfa_status: "BELUM",
    details: {},
  });
  assert.ok(flags.includes("EMAIL BELUM TERVERIFIKASI"));
  assert.ok(flags.includes("WA BELUM DIVERIFIKASI"));
  assert.ok(flags.includes("PFA BELUM SELESAI"));

  const klinis = computeRedFlags({
    track: "KLINIS",
    email_verified_at: new Date().toISOString(),
    wa_joined_confirmed_at: null,
    pfa_status: "BELUM",
    details: { sip_status: "TIDAK_AKTIF" },
  });
  assert.ok(klinis.includes("STR TIDAK AKTIF"));
  assert.ok(!klinis.includes("WA BELUM DIVERIFIKASI"));
});

test("red flag mendeteksi berkas kurang bila document_count === 0", () => {
  const flags = computeRedFlags({
    track: "KLINIS",
    email_verified_at: new Date().toISOString(),
    wa_joined_confirmed_at: null,
    pfa_status: "SELESAI",
    details: { document_count: 0 },
  });
  assert.ok(flags.includes("BERKAS KURANG"));
});

test("needsAction true bila belum verifikasi email lewat 7 hari", () => {
  const applied = new Date("2026-10-01T00:00:00Z");
  assert.equal(
    needsAction(
      { applied_at: applied.toISOString(), email_verified_at: null },
      new Date("2026-10-05T00:00:00Z")
    ),
    false
  );
  assert.equal(
    needsAction(
      { applied_at: applied.toISOString(), email_verified_at: null },
      new Date("2026-10-09T00:00:00Z")
    ),
    true
  );
});
