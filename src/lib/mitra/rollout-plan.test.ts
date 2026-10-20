import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildDesiredEnv,
  diffEnv,
  isSecretEnvKey,
  redactEnvValue,
  type DesiredEnvVar,
  type ExistingEnvVar,
} from "./rollout-plan";

test("kunci rahasia dikenali untuk penandaan sensitive", () => {
  for (const key of [
    "SUPABASE_SERVICE_ROLE_KEY",
    "MITRA_UPLOAD_SECRET",
    "SWEEP_SECRET",
    "CRON_SECRET",
    "RESEND_API_KEY",
    "BREVO_API_KEY",
  ]) {
    assert.equal(isSecretEnvKey(key), true, key);
  }
  for (const key of [
    "NEXT_PUBLIC_SITE_URL",
    "NEXT_PUBLIC_MITRA_INTAKE_ENABLED",
    "APP_URL",
    "EMAIL_FROM",
  ]) {
    assert.equal(isSecretEnvKey(key), false, key);
  }
});

test("buildDesiredEnv menghasilkan env var yang lengkap dan tertarget", () => {
  const desired = buildDesiredEnv({
    supabaseServiceRoleKey: "sb_secret_x",
    mitraUploadSecret: "upload",
    sweepSecret: "sweep",
    cronSecret: "cron",
    appUrl: "https://letmehearyou.id",
    emailFrom: "Let Me Hear You <halo@mail.letmehearyou.id>",
    adminSystemActorId: "uuid-admin",
    mitraIntakeEnabled: false,
    psikologEnabled: false,
    pendampingEnabled: false,
    shadowMode: false,
    whitelistEmails: "",
  });

  const byKey = new Map(desired.map((d) => [d.key, d]));

  assert.equal(byKey.get("SUPABASE_SERVICE_ROLE_KEY")?.value, "sb_secret_x");
  assert.equal(byKey.get("SUPABASE_SERVICE_ROLE_KEY")?.sensitive, true);
  assert.equal(byKey.get("SUPABASE_SERVICE_ROLE_KEY")?.target, "production");
  assert.equal(byKey.get("APP_URL")?.sensitive, false);
  assert.equal(byKey.get("NEXT_PUBLIC_MITRA_INTAKE_ENABLED")?.value, "false");
  assert.equal(byKey.get("NEXT_PUBLIC_MITRA_INTAKE_ENABLED")?.target, "production");
  assert.equal(byKey.get("MITRA_INTAKE_WHITELIST_EMAILS")?.value, "");
  assert.equal(byKey.get("ADMIN_SYSTEM_ACTOR_ID")?.value, "uuid-admin");
});

test("buildDesiredEnv mengabaikan kunci email kosong", () => {
  const desired = buildDesiredEnv({
    supabaseServiceRoleKey: "s",
    mitraUploadSecret: "u",
    sweepSecret: "w",
    cronSecret: "c",
    appUrl: "https://letmehearyou.id",
    emailFrom: "",
    resendApiKey: "",
    brevoApiKey: "",
    adminSystemActorId: "",
    mitraIntakeEnabled: false,
    psikologEnabled: false,
    pendampingEnabled: false,
    shadowMode: false,
    whitelistEmails: "",
  });
  const keys = desired.map((d) => d.key);
  assert.ok(!keys.includes("RESEND_API_KEY"));
  assert.ok(!keys.includes("BREVO_API_KEY"));
  assert.ok(!keys.includes("EMAIL_FROM"));
  assert.ok(!keys.includes("ADMIN_SYSTEM_ACTOR_ID"));
  // whitelist tetap dikelola walau kosong (kosong = semua email boleh)
  assert.ok(keys.includes("MITRA_INTAKE_WHITELIST_EMAILS"));
});

test("diffEnv memisahkan create, update, dan unchanged", () => {
  const existing: ExistingEnvVar[] = [
    { id: "e1", key: "APP_URL", type: "plain", target: ["production"], value: "https://lama.test" },
    { id: "e2", key: "SWEEP_SECRET", type: "encrypted", target: ["production"], value: "lama" },
    { id: "e3", key: "ADMIN_PIN", type: "plain", target: ["production"], value: "123456" },
  ];
  const desired: DesiredEnvVar[] = [
    { key: "APP_URL", value: "https://baru.test", type: "plain", target: "production", sensitive: false },
    { key: "SWEEP_SECRET", value: "baru", type: "encrypted", target: "production", sensitive: true },
    { key: "CRON_SECRET", value: "cron", type: "encrypted", target: "production", sensitive: true },
  ];

  const diff = diffEnv(existing, desired);
  assert.deepEqual(diff.create.map((d) => d.key), ["CRON_SECRET"]);
  assert.deepEqual(
    diff.update.map((u) => u.desired.key),
    ["APP_URL", "SWEEP_SECRET"]
  );
  assert.deepEqual(diff.unchanged, []);
  assert.deepEqual(diff.remove.map((e) => e.key), ["ADMIN_PIN"]);
});

test("diffEnv menandai env yang bernilai sama sebagai unchanged", () => {
  const existing: ExistingEnvVar[] = [
    { id: "e1", key: "APP_URL", type: "plain", target: ["production"], value: "https://sama.test" },
  ];
  const desired: DesiredEnvVar[] = [
    { key: "APP_URL", value: "https://sama.test", type: "plain", target: "production", sensitive: false },
  ];
  const diff = diffEnv(existing, desired);
  assert.deepEqual(diff.create, []);
  assert.deepEqual(diff.update, []);
  assert.deepEqual(diff.unchanged.map((d) => d.key), ["APP_URL"]);
  assert.deepEqual(diff.remove, []);
});

test("redactEnvValue menyembunyikan nilai rahasia tapi mempertahankan panjang", () => {
  const masked = redactEnvValue("SWEEP_SECRET", "abcdef123456");
  assert.ok(!masked.includes("abcdef"));
  assert.ok(masked.includes("*"));
  assert.equal(redactEnvValue("APP_URL", "https://situs.test"), "https://situs.test");
  assert.equal(redactEnvValue("MITRA_INTAKE_WHITELIST_EMAILS", ""), "");
});
