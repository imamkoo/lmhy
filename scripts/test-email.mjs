#!/usr/bin/env node
/**
 * Uji kirim email notifikasi lewat adapter yang sama dengan aplikasi
 * (src/lib/email.ts → Resend, fallback Brevo).
 *
 * Usage:
 *   RESEND_API_KEY=re_xxx EMAIL_FROM="Let Me Hear You <noreply@letmehearyou.id>" \
 *     node scripts/test-email.mjs recipient@contoh.id
 *
 * Menguji: adapter, provider, dan (kalau diminta) integrasi template aplikasi.
 */

const to = process.argv[2];
if (!to) {
  console.error("Usage: node scripts/test-email.mjs <email-tujuan>");
  process.exit(1);
}

const { sendEmail } = await import("../src/lib/email.ts");
const {
  applicationApprovedTemplate,
  applicationReceivedTemplate,
  applicationRejectedTemplate,
} = await import("../src/lib/email-templates.ts");

const hasResend = Boolean(process.env.RESEND_API_KEY);
const hasBrevo = Boolean(process.env.BREVO_API_KEY);

console.log("=== Konfigurasi email ===");
console.log(`  RESEND_API_KEY : ${hasResend ? "TERSET" : "kosong"}`);
console.log(`  BREVO_API_KEY  : ${hasBrevo ? "TERSET" : "kosong"}`);
console.log(`  EMAIL_FROM     : ${process.env.EMAIL_FROM || "(kosong → default)"}`);
console.log(`  tujuan         : ${to}`);

if (!hasResend && !hasBrevo) {
  console.error(
    "\nGAGAL: tidak ada provider email yang dikonfigurasi (RESEND_API_KEY / BREVO_API_KEY kosong).",
  );
  process.exit(1);
}

const results = [];

results.push([
  "template diterima",
  await sendEmail({
    to,
    ...applicationReceivedTemplate({ applicantName: "Tester QA", username: "testerqa" }),
  }),
]);
results.push([
  "template disetujui",
  await sendEmail({
    to,
    ...applicationApprovedTemplate({
      applicantName: "Tester QA",
      roleLabel: "Praktisi Klinis",
      username: "testerqa",
    }),
  }),
]);
results.push([
  "template ditolak",
  await sendEmail({
    to,
    ...applicationRejectedTemplate({
      applicantName: "Tester QA",
      note: "Dokumen STR tidak terbaca. Mohon unggah ulang.",
      username: "testerqa",
    }),
  }),
]);

console.log("\n=== Hasil kirim ===");
let okCount = 0;
for (const [label, res] of results) {
  const status = res.ok ? "OK" : res.skipped ? "SKIP" : "GAGAL";
  if (res.ok) okCount += 1;
  console.log(`  ${status.padEnd(5)} ${label}${res.error ? ` — ${res.error}` : ""}`);
}

console.log(
  `\n${okCount}/${results.length} email terkirim. Cek inbox (dan folder spam) ${to}.`,
);
process.exit(okCount > 0 ? 0 : 1);
