import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

const ENV_KEYS = [
  "NEXT_PUBLIC_MITRA_INTAKE_ENABLED",
  "NEXT_PUBLIC_MITRA_INTAKE_PENDAMPING_ENABLED",
  "NEXT_PUBLIC_MITRA_INTAKE_PSIKOLOG_ENABLED",
] as const;

const originalEnv = Object.fromEntries(
  ENV_KEYS.map((key) => [key, process.env[key]]),
);

afterEach(() => {
  for (const key of ENV_KEYS) {
    const value = originalEnv[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
});

test("keikutsertaan mitra hanya aktif saat flag publik bernilai true", async () => {
  delete process.env.NEXT_PUBLIC_MITRA_INTAKE_ENABLED;
  const { isMitraIntakeEnabled } = await import("./flags");

  assert.equal(isMitraIntakeEnabled(), false);

  process.env.NEXT_PUBLIC_MITRA_INTAKE_ENABLED = "true";
  assert.equal(isMitraIntakeEnabled(), true);
});

test("jalur mengikuti flag global dan dapat dinonaktifkan per jalur", async () => {
  process.env.NEXT_PUBLIC_MITRA_INTAKE_ENABLED = "true";
  delete process.env.NEXT_PUBLIC_MITRA_INTAKE_PENDAMPING_ENABLED;
  process.env.NEXT_PUBLIC_MITRA_INTAKE_PSIKOLOG_ENABLED = "false";
  const { isTrackEnabled } = await import("./flags");

  assert.equal(isTrackEnabled("SEBAYA"), true);
  assert.equal(isTrackEnabled("KLINIS"), false);

  process.env.NEXT_PUBLIC_MITRA_INTAKE_ENABLED = "false";
  assert.equal(isTrackEnabled("SEBAYA"), false);
});
