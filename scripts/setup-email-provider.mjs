#!/usr/bin/env node
/**
 * Setup provider email aplikasi (Resend) dalam satu perintah:
 *   1. cek status domain di Resend + record DNS yang kurang
 *   2. uji kirim 3 template notifikasi lewat adapter aplikasi
 *   3. set RESEND_API_KEY + EMAIL_FROM di Vercel production
 *   4. trigger redeploy + tunggu READY
 *
 * Usage:
 *   RESEND_API_KEY=re_xxx VERCEL_TOKEN=xxx \
 *     node scripts/setup-email-provider.mjs --to=email-untuk-diuji@gmail.com
 *
 * Env:
 *   RESEND_API_KEY   wajib
 *   VERCEL_TOKEN     wajib (kecuali --skip-vercel)
 *   EMAIL_FROM       opsional (default "Let Me Hear You <noreply@letmehearyou.id>")
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(process.cwd());
const ENV_LOCAL = path.join(ROOT, ".env.local");

const args = process.argv.slice(2);
const valueOf = (name, fallback) => {
  const found = args.find((a) => a.startsWith(`--${name}=`));
  return found ? found.slice(name.length + 3) : fallback;
};
const has = (flag) => args.includes(flag);

const TEST_TO = valueOf("to", "");
const SKIP_VERCEL = has("--skip-vercel");
const DRY_RUN = has("--dry-run");
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const VERCEL_TOKEN = process.env.VERCEL_TOKEN || "";
const EMAIL_FROM =
  process.env.EMAIL_FROM || "Let Me Hear You <noreply@letmehearyou.id>";
const VERCEL_PROJECT = process.env.VERCEL_PROJECT || "lmhy";

const log = (...a) => console.log(...a);
const step = (n, total, t) => log(`\n\x1b[1m[${n}/${total}] ${t}\x1b[0m`);
const ok = (m) => log(`  \x1b[32m✓\x1b[0m ${m}`);
const warn = (m) => log(`  \x1b[33m!\x1b[0m ${m}`);
const fail = (m) => log(`  \x1b[31m✗\x1b[0m ${m}`);
const info = (m) => log(`    ${m}`);

async function api(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!res.ok) {
    throw new Error(
      `${options.method || "GET"} ${url} → ${res.status} ${JSON.stringify(body).slice(0, 400)}`,
    );
  }
  return body;
}

const resend = (p, options = {}) =>
  api(`https://api.resend.com${p}`, {
    ...options,
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, ...(options.headers || {}) },
  });

const vercel = (p, options = {}) =>
  api(`https://api.vercel.com${p}`, {
    ...options,
    headers: { Authorization: `Bearer ${VERCEL_TOKEN}`, ...(options.headers || {}) },
  });

function upsertEnvLocal(vars) {
  let content = fs.existsSync(ENV_LOCAL) ? fs.readFileSync(ENV_LOCAL, "utf-8") : "";
  for (const [key, value] of Object.entries(vars)) {
    if (!value) continue;
    const line = `${key}=${value}`;
    const re = new RegExp(`^${key}=.*$`, "m");
    content = re.test(content)
      ? content.replace(re, line)
      : `${content.trimEnd()}\n${line}\n`;
  }
  fs.writeFileSync(ENV_LOCAL, content);
}

async function main() {
  const total = 4;
  log("\n\x1b[1m══ Setup Provider Email (Resend) ══\x1b[0m");
  info(`mode: ${DRY_RUN ? "DRY RUN" : "LIVE"} · EMAIL_FROM: ${EMAIL_FROM}`);

  if (!RESEND_API_KEY) {
    fail("RESEND_API_KEY belum di-set — https://resend.com/api-keys");
    process.exit(1);
  }

  // ------------------------------------------------------------ 1. status domain
  step(1, total, "Cek status domain di Resend");
  const domains = await resend("/domains");
  const list = Array.isArray(domains) ? domains : domains.data ?? [];
  if (!list.length) {
    fail("Tidak ada domain di akun Resend ini — tambahkan domain dulu di dashboard");
    process.exit(1);
  }
  for (const d of list) {
    const state = d.status === "verified" ? "VERIFIED" : `PENDING (${d.status})`;
    info(`${d.name.padEnd(28)} ${state}`);
    for (const rec of d.records ?? []) {
      const ready = rec.status === "verified" ? "✓" : "·";
      info(`  ${ready} ${rec.type.padEnd(8)} ${rec.name} → ${rec.value}`);
    }
  }
  const verified = list.filter((d) => d.status === "verified");
  if (verified.length) ok(`${verified.length} domain terverifikasi: ${verified.map((d) => d.name).join(", ")}`);
  else warn("Belum ada domain terverifikasi — email mungkin masuk spam atau ditolak");

  // --------------------------------------------------------------- 2. uji kirim
  step(2, total, "Uji kirim 3 template notifikasi");
  if (!TEST_TO) {
    warn("tidak ada --to, uji kirim dilewati");
  } else {
    const { sendEmail } = await import("../src/lib/email.ts");
    const {
      applicationApprovedTemplate,
      applicationReceivedTemplate,
      applicationRejectedTemplate,
    } = await import("../src/lib/email-templates.ts");

    const cases = [
      ["diterima", applicationReceivedTemplate({ applicantName: "Tester QA", username: "testerqa" })],
      ["disetujui", applicationApprovedTemplate({ applicantName: "Tester QA", roleLabel: "Praktisi Klinis", username: "testerqa" })],
      ["ditolak", applicationRejectedTemplate({ applicantName: "Tester QA", note: "Dokumen STR tidak terbaca. Mohon unggah ulang.", username: "testerqa" })],
    ];
    for (const [label, content] of cases) {
      const res = await sendEmail({ to: TEST_TO, ...content });
      if (res.ok) ok(`${label} → terkirim ke ${TEST_TO}`);
      else fail(`${label} → ${res.skipped ? "SKIP" : "GAGAL"}: ${res.error}`);
    }
  }

  // ---------------------------------------------------------- 3. set env Vercel
  step(3, total, "Set env var di Vercel production");
  if (SKIP_VERCEL || DRY_RUN) {
    warn("Dilewati (dry-run / --skip-vercel)");
  } else {
    if (!VERCEL_TOKEN) {
      fail("VERCEL_TOKEN belum di-set");
      process.exit(1);
    }
    const project = await vercel(`/v9/projects/${VERCEL_PROJECT}`);
    const envs = (await vercel(`/v9/projects/${project.id}/env`)).envs ?? [];
    const desired = [
      { key: "RESEND_API_KEY", value: RESEND_API_KEY, type: "encrypted" },
      { key: "EMAIL_FROM", value: EMAIL_FROM, type: "plain" },
    ];
    for (const item of desired) {
      const current = envs.find(
        (e) => e.key === item.key && e.target.includes("production"),
      );
      if (current) {
        await vercel(`/v9/projects/${project.id}/env/${current.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            value: item.value,
            type: item.type,
            target: ["production"],
          }),
        });
        ok(`diupdate ${item.key}`);
      } else {
        await vercel(`/v10/projects/${project.id}/env`, {
          method: "POST",
          body: JSON.stringify({
            key: item.key,
            value: item.value,
            type: item.type,
            target: ["production"],
            sensitive: false,
          }),
        });
        ok(`dibuat ${item.key}`);
      }
    }
  }

  // ------------------------------------------------------------- 4. redeploy
  step(4, total, "Trigger redeploy production");
  if (SKIP_VERCEL || DRY_RUN) {
    warn("Dilewati (dry-run / --skip-vercel)");
  } else {
    const deployments = await vercel(
      `/v6/deployments?projectId=${project.id}&target=production&limit=1`,
    );
    const latest = deployments.deployments?.[0];
    if (!latest) {
      fail("tidak ada deployment production sebelumnya");
      process.exit(1);
    }
    const created = await vercel("/v13/deployments", {
      method: "POST",
      body: JSON.stringify({
        name: VERCEL_PROJECT,
        project: project.id,
        deploymentId: latest.uid || latest.id,
        target: "production",
      }),
    });
    ok(`redeploy dipicu: ${created.id}`);
    info("menunggu build…");
    let state = created.readyState;
    for (let i = 0; i < 90 && state !== "READY" && state !== "ERROR"; i += 1) {
      await new Promise((r) => setTimeout(r, 10000));
      const status = await vercel(`/v13/deployments/${created.id}`);
      state = status.readyState;
      process.stdout.write(`    … ${state}\n`);
    }
    if (state === "READY") ok("deployment production READY");
    else {
      fail(`deployment berakhir state=${state}`);
      process.exit(1);
    }
  }

  if (!DRY_RUN) {
    upsertEnvLocal({ RESEND_API_KEY, EMAIL_FROM });
    ok(".env.local diperbarui (gitignored)");
  }

  log("\n\x1b[1m══ Selesai ══\x1b[0m");
  log("Langkah berikut:");
  log("  1. Cek inbox + spam untuk email uji — pastikan 3 email masuk");
  log("  2. Jalankan 21 skenario QA di docs/qa/mitra-intake-admin-qa.md");
  log("  3. Naikkan flag rollout: npm run rollout:mitra -- --phase=3");
  log("");
}

await main();
