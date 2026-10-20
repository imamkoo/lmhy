#!/usr/bin/env node

/**
 * Rollout SP-1: jalankan migrasi DB, siapkan akun admin, set env Vercel, redeploy.
 *
 * Usage:
 *   SUPABASE_PAT=... VERCEL_TOKEN=... node scripts/rollout-mitra-intake.mjs
 *   node scripts/rollout-mitra-intake.mjs --dry-run
 *
 * Env yang dibaca:
 *   SUPABASE_PAT          Personal Access Token Supabase (wajib)
 *   VERCEL_TOKEN         Vercel API Token (wajib)
 *   SUPABASE_PROJECT_REF  default: wzywhjsxrbkgoxaingar
 *   VERCEL_PROJECT        default: lmhy
 *   VERCEL_TEAM           default: imamko
 *   SUPABASE_URL          default: https://<ref>.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY  (opsional; bila kosong, dibaca dari Vercel)
 *   MITRA_UPLOAD_SECRET / SWEEP_SECRET / CRON_SECRET  (opsional; bila kosong, di-generate)
 *   EMAIL_FROM / RESEND_API_KEY / BREVO_API_KEY     (opsional)
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {
  buildDesiredEnv,
  diffEnv,
  redactEnvValue,
} from "../src/lib/mitra/rollout-plan.ts";

const ROOT = path.resolve(process.cwd());
const MIGRATION_DIR = path.join(ROOT, "supabase", "migrations");
const ENV_LOCAL = path.join(ROOT, ".env.local");

const MIGRATIONS = [
  "20261020000000_provider_intake_admin.sql",
  "20261020010000_admin_audit_document_purged.sql",
];

const args = process.argv.slice(2);
const has = (flag) => args.includes(flag);
const valueOf = (name, fallback) => {
  const found = args.find((a) => a.startsWith(`--${name}=`));
  return found ? found.slice(name.length + 3) : fallback;
};

const DRY_RUN = has("--dry-run");
const SKIP_MIGRATIONS = has("--skip-migrations");
const SKIP_VERCEL = has("--skip-vercel");
const SKIP_ADMIN = has("--skip-admin");
const ADMIN_EMAIL = valueOf("admin-email", "admin@letmehearyou.id");
const PHASE = valueOf("phase", "1");
const APP_URL = process.env.APP_URL || "https://letmehearyou.id";

const SUPABASE_REF = process.env.SUPABASE_PROJECT_REF || "wzywhjsxrbkgoxaingar";
const SUPABASE_URL =
  process.env.SUPABASE_URL || `https://${SUPABASE_REF}.supabase.co`;
const VERCEL_PROJECT = process.env.VERCEL_PROJECT || "lmhy";
const VERCEL_TEAM = process.env.VERCEL_TEAM || "imamko";

const SUPABASE_PAT = process.env.SUPABASE_PAT;
const VERCEL_TOKEN = process.env.VERCEL_TOKEN;

const log = (...a) => console.log(...a);
const step = (n, total, title) =>
  log(`\n\x1b[1m[${n}/${total}] ${title}\x1b[0m`);
const ok = (msg) => log(`  \x1b[32m✓\x1b[0m ${msg}`);
const warn = (msg) => log(`  \x1b[33m!\x1b[0m ${msg}`);
const fail = (msg) => log(`  \x1b[31m✗\x1b[0m ${msg}`);
const info = (msg) => log(`    ${msg}`);

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
    const detail =
      typeof body === "string" ? body : JSON.stringify(body).slice(0, 500);
    throw new Error(
      `${options.method || "GET"} ${url.replace(/[?&][^&]*(token|key)=[^&]*/gi, "")} → ${res.status} ${detail}`,
    );
  }
  return body;
}

const supabaseApi = (p, options = {}) =>
  api(`https://api.supabase.com/v1${p}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${SUPABASE_PAT}`,
      ...(options.headers || {}),
    },
  });

const vercelApi = (p, options = {}) =>
  api(`https://api.vercel.com${p}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${VERCEL_TOKEN}`,
      ...(options.headers || {}),
    },
  });

function splitStatements(sql) {
  const statements = [];
  let current = "";
  let inDollar = false;
  let inSingle = false;
  let inLineComment = false;
  for (let i = 0; i < sql.length; i += 1) {
    const ch = sql[i];
    const next = sql[i + 1];
    if (inLineComment) {
      current += ch;
      if (ch === "\n") inLineComment = false;
      continue;
    }
    if (!inDollar && !inSingle && ch === "-" && next === "-") {
      inLineComment = true;
      current += ch;
      continue;
    }
    if (!inSingle && ch === "$" && next === "$") {
      inDollar = !inDollar;
      current += ch + next;
      i += 1;
      continue;
    }
    if (!inDollar && ch === "'") {
      if (inSingle && next === "'") {
        current += ch + next;
        i += 1;
        continue;
      }
      inSingle = !inSingle;
      current += ch;
      continue;
    }
    if (!inDollar && !inSingle && ch === ";") {
      const trimmed = current.trim();
      if (trimmed) statements.push(trimmed);
      current = "";
      continue;
    }
    current += ch;
  }
  const tail = current.trim();
  if (tail) statements.push(tail);
  return statements;
}

async function runSql(query) {
  return supabaseApi(`/projects/${SUPABASE_REF}/database/query`, {
    method: "POST",
    body: JSON.stringify({ query }),
  });
}

function generateSecret() {
  return crypto.randomBytes(32).toString("hex");
}

function upsertEnvLocal(vars) {
  let content = fs.existsSync(ENV_LOCAL)
    ? fs.readFileSync(ENV_LOCAL, "utf-8")
    : "";
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

const PHASE_FLAGS = {
  1: { intake: false, psikolog: false, pendamping: false, shadow: false, whitelist: "" },
  2: { intake: true, psikolog: true, pendamping: true, shadow: true, whitelist: "" },
  3: { intake: true, psikolog: true, pendamping: true, shadow: true, whitelist: "" },
  4: { intake: true, psikolog: true, pendamping: false, shadow: false, whitelist: "" },
  5: { intake: true, psikolog: true, pendamping: true, shadow: false, whitelist: "" },
};

async function resolveVercelContext() {
  const project = await vercelApi(`/v9/projects/${VERCEL_TEAM}/${VERCEL_PROJECT}`);
  const envs = (
    await vercelApi(`/v9/projects/${project.id}/env?teamId=${project.teamId}`)
  ).envs || [];
  return { project, envs };
}

async function createVercelEnv(projectId, teamId, item) {
  const body = JSON.stringify({
    key: item.key,
    value: item.value,
    type: item.type,
    target: [item.target],
    sensitive: false,
  });
  // Versi endpoint create berbeda-beda antar versi API; coba v10 lalu v9.
  for (const version of ["v10", "v9"]) {
    try {
      return await vercelApi(
        `/${version}/projects/${projectId}/env?teamId=${teamId}`,
        { method: "POST", body },
      );
    } catch (err) {
      if (version === "v9") throw err;
      info(`create env ${item.key} via ${version} gagal (${err.message}) — coba v9`);
    }
  }
  return null;
}

async function main() {
  const total = 7;
  log("\n\x1b[1m══ Rollout SP-1: Mitra Intake & Admin Verification Queue ══\x1b[0m");
  info(
    `mode: ${DRY_RUN ? "DRY RUN (tidak mengubah apa pun)" : "LIVE"} · phase: ${PHASE} · admin: ${ADMIN_EMAIL}`,
  );

  const flags = PHASE_FLAGS[PHASE];
  if (!flags) {
    fail(`Phase tidak dikenal: ${PHASE}. Pilihan: ${Object.keys(PHASE_FLAGS).join(", ")}`);
    process.exit(1);
  }

  if (!DRY_RUN) {
    if (!SUPABASE_PAT && !SKIP_MIGRATIONS) {
      fail("SUPABASE_PAT belum di-set — https://supabase.com/dashboard/account/tokens");
      process.exit(1);
    }
    if (!VERCEL_TOKEN && !SKIP_VERCEL) {
      fail("VERCEL_TOKEN belum di-set — https://vercel.com/account/tokens");
      process.exit(1);
    }
  }

  // ------------------------------------------------------- 1. migrasi database
  step(1, total, "Terapkan migrasi database (Supabase Management API)");

  if (SKIP_MIGRATIONS) {
    warn("Dilewati (--skip-migrations)");
  } else if (DRY_RUN) {
    for (const file of MIGRATIONS) {
      const full = path.join(MIGRATION_DIR, file);
      const sql = fs.existsSync(full) ? fs.readFileSync(full, "utf-8") : "";
      info(`${file} → ${splitStatements(sql).length} statement`);
    }
  } else {
    for (const file of MIGRATIONS) {
      const full = path.join(MIGRATION_DIR, file);
      if (!fs.existsSync(full)) {
        fail(`file migrasi tidak ditemukan: ${full}`);
        process.exit(1);
      }
      const sql = fs.readFileSync(full, "utf-8");
      const statements = splitStatements(sql);
      info(`${file} → ${statements.length} statement, mengeksekusi…`);
      try {
        await runSql(sql);
        ok(`${file} diterapkan (multi-statement)`);
      } catch (multiErr) {
        info(`multi-statement ditolak (${multiErr.message}) — fallback per statement…`);
        for (const [index, statement] of statements.entries()) {
          try {
            await runSql(statement);
          } catch (err) {
            fail(`${file} statement #${index + 1} gagal: ${err.message}`);
            process.exit(1);
          }
        }
        ok(`${file} diterapkan (${statements.length} statement, satu per satu)`);
      }
    }
  }

  // ------------------------------------------------------ 2. verifikasi hasil
  step(2, total, "Verifikasi hasil migrasi");

  if (DRY_RUN || SKIP_MIGRATIONS) {
    warn("Dilewati (dry-run / --skip-migrations)");
  } else {
    const tableRes = await runSql(
      `SELECT count(*)::int AS n FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name IN
       ('provider_applications','provider_documents','admin_audit_log')`,
    );
    const tableCount = tableRes?.[0]?.n ?? 0;
    if (tableCount === 3) ok("3 tabel mitra ada");
    else fail(`hanya ${tableCount}/3 tabel mitra yang ada`);

    const bucketRes = await runSql(
      "SELECT public FROM storage.buckets WHERE id = 'provider-credentials'",
    );
    const bucket = bucketRes?.[0];
    if (bucket && bucket.public === false)
      ok("bucket provider-credentials private");
    else fail(`bucket provider-credentials public=${bucket?.public ?? "tidak ada"}`);

    const policyRes = await runSql(
      `SELECT count(*)::int AS n FROM pg_policies
       WHERE tablename IN ('provider_applications','provider_documents','admin_audit_log')`,
    );
    const policyCount = policyRes?.[0]?.n ?? 0;
    if (policyCount === 0) ok("RLS deny-all terverifikasi (0 policy)");
    else fail(`ditemukan ${policyCount} policy RLS — deny-all broken`);

    const fnRes = await runSql(
      "SELECT count(*)::int AS n FROM pg_proc WHERE proname = 'release_mitra_username'",
    );
    if ((fnRes?.[0]?.n ?? 0) > 0) ok("fungsi release_mitra_username ada");
    else fail("fungsi release_mitra_username tidak ditemukan");
  }

  // --------------------------------------- 3. resolusikan konteks Vercel (read)
  step(3, total, "Resolusi project Vercel & ambil service role key");

  let vercelProject = null;
  let existingEnv = [];
  let serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (DRY_RUN || SKIP_VERCEL) {
    warn("Dilewati (dry-run / --skip-vercel)");
  } else {
    const ctx = await resolveVercelContext();
    vercelProject = ctx.project;
    existingEnv = ctx.envs;
    ok(`project: ${VERCEL_PROJECT} (${vercelProject.id})`);
    info(`${existingEnv.length} env var existing`);

    if (!serviceRoleKey) {
      const found = existingEnv.find((e) => e.key === "SUPABASE_SERVICE_ROLE_KEY");
      if (found?.value) {
        serviceRoleKey = found.value;
        ok("SUPABASE_SERVICE_ROLE_KEY dibaca dari Vercel");
      } else {
        fail(
          "SUPABASE_SERVICE_ROLE_KEY tidak terbaca dari Vercel — pass manual: SUPABASE_SERVICE_ROLE_KEY=...",
        );
        process.exit(1);
      }
    } else {
      ok("SUPABASE_SERVICE_ROLE_KEY dari environment lokal");
    }
  }

  if (!serviceRoleKey) {
    if (DRY_RUN) {
      serviceRoleKey = "sb_secret_DRY_RUN_PLACEHOLDER";
      warn("dry-run: memakai placeholder service role key");
    } else {
      fail("SUPABASE_SERVICE_ROLE_KEY tidak tersedia");
      process.exit(1);
    }
  }

  // ------------------------------------------------------- 4. akun admin
  step(4, total, `Siapkan akun admin (${ADMIN_EMAIL})`);

  let adminUserId = process.env.ADMIN_SYSTEM_ACTOR_ID || "";

  if (DRY_RUN || SKIP_ADMIN) {
    warn("Dilewati (dry-run / --skip-admin)");
  } else {
    const authHeaders = {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
    };

    const listRes = await fetch(
      `${SUPABASE_URL}/auth/v1/admin/users?per_page=200`,
      { headers: authHeaders },
    );
    const listBody = await listRes.json();
    const found = (listBody.users || []).find(
      (u) => (u.email || "").toLowerCase() === ADMIN_EMAIL.toLowerCase(),
    );

    if (found) {
      adminUserId = found.id;
      ok(`user sudah ada (${adminUserId})`);
    } else {
      const createRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          email: ADMIN_EMAIL,
          email_confirm: true,
          user_metadata: { full_name: "Admin LMHY" },
        }),
      });
      const createBody = await createRes.json();
      if (!createRes.ok) {
        fail(`gagal membuat user: ${JSON.stringify(createBody).slice(0, 300)}`);
        process.exit(1);
      }
      adminUserId = createBody.id;
      ok(`user dibuat (${adminUserId}), email_confirm=true`);
    }

    const updateRes = await fetch(
      `${SUPABASE_URL}/auth/v1/admin/users/${adminUserId}`,
      {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({
          app_metadata: { ...(found?.app_metadata || {}), is_admin: true },
        }),
      },
    );
    if (!updateRes.ok) {
      fail(`gagal set app_metadata.is_admin (HTTP ${updateRes.status})`);
      process.exit(1);
    }
    ok("app_metadata.is_admin = true");

    const profileRes = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?select=id&id=eq.${adminUserId}`,
      { headers: { ...authHeaders, Prefer: "return=representation" } },
    );
    const profiles = await profileRes.json();
    if (Array.isArray(profiles) && profiles.length === 0) {
      const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
        method: "POST",
        headers: { ...authHeaders, Prefer: "return=representation" },
        body: JSON.stringify({
          id: adminUserId,
          username: "admin-lmhy",
          display_name: "Admin LMHY",
          creator_role: "PENULIS",
          service_track: null,
          verification_status: "NONE",
        }),
      });
      if (insertRes.ok) ok("profil dibuat untuk admin");
      else warn(`profil admin belum ada (HTTP ${insertRes.status}) — buat manual bila perlu`);
    } else {
      ok("profil admin sudah ada");
    }
  }

  // ---------------------------------------------------- 5. env var Vercel
  step(5, total, "Set env var di Vercel");

  const secrets = {
    mitraUploadSecret: process.env.MITRA_UPLOAD_SECRET || generateSecret(),
    sweepSecret: process.env.SWEEP_SECRET || generateSecret(),
    cronSecret: process.env.CRON_SECRET || generateSecret(),
  };

  const desired = buildDesiredEnv({
    supabaseServiceRoleKey: serviceRoleKey,
    mitraUploadSecret: secrets.mitraUploadSecret,
    sweepSecret: secrets.sweepSecret,
    cronSecret: secrets.cronSecret,
    appUrl: APP_URL,
    emailFrom: process.env.EMAIL_FROM || "",
    resendApiKey: process.env.RESEND_API_KEY || "",
    brevoApiKey: process.env.BREVO_API_KEY || "",
    adminSystemActorId: adminUserId,
    mitraIntakeEnabled: flags.intake,
    psikologEnabled: flags.psikolog,
    pendampingEnabled: flags.pendamping,
    shadowMode: flags.shadow,
    whitelistEmails: flags.whitelist,
  });

  if (DRY_RUN || SKIP_VERCEL) {
    info(`rencana ${desired.length} env var:`);
    for (const d of desired) {
      info(`  ${d.key} = ${redactEnvValue(d.key, d.value)} (${d.type})`);
    }
  } else {
    const diff = diffEnv(existingEnv, desired);
    for (const item of diff.create) {
      await createVercelEnv(vercelProject.id, vercelProject.teamId, item);
      ok(`dibuat   ${item.key} = ${redactEnvValue(item.key, item.value)}`);
    }
    for (const { existing, desired: want } of diff.update) {
      await vercelApi(
        `/v9/projects/${vercelProject.id}/env/${existing.id}?teamId=${vercelProject.teamId}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            value: want.value,
            type: want.type,
            target: [want.target],
          }),
        },
      );
      ok(`diupdate ${want.key} = ${redactEnvValue(want.key, want.value)}`);
    }
    for (const item of diff.unchanged) info(`sama     ${item.key}`);
    if (diff.remove.length) {
      warn(
        `env var tidak lagi dipakai: ${diff.remove.map((e) => e.key).join(", ")} — TIDAK dihapus otomatis`,
      );
    }
    ok(
      `total: ${diff.create.length} dibuat · ${diff.update.length} diperbarui · ${diff.unchanged.length} sama`,
    );
  }

  // ------------------------------------------------------------- 6. redeploy
  step(6, total, "Trigger redeploy production (NEXT_PUBLIC_* di-bake saat build)");

  if (DRY_RUN || SKIP_VERCEL) {
    warn("Dilewati (dry-run / --skip-vercel)");
  } else {
    const deployments = await vercelApi(
      `/v6/deployments?projectId=${vercelProject.id}&target=production&limit=1&teamId=${vercelProject.teamId}`,
    );
    const latest = deployments.deployments?.[0];
    if (!latest) {
      fail("tidak ada deployment production sebelumnya untuk di-redeploy");
      process.exit(1);
    }
    const created = await vercelApi(
      `/v13/deployments?teamId=${vercelProject.teamId}`,
      {
        method: "POST",
        body: JSON.stringify({
          name: VERCEL_PROJECT,
          project: vercelProject.id,
          deploymentId: latest.uid || latest.id,
          target: "production",
        }),
      },
    );
    ok(`redeploy dipicu: ${created.id}`);

    info("menunggu build…");
    let state = created.readyState;
    for (let i = 0; i < 90 && state !== "READY" && state !== "ERROR"; i += 1) {
      await new Promise((r) => setTimeout(r, 10000));
      const status = await vercelApi(
        `/v13/deployments/${created.id}?teamId=${vercelProject.teamId}`,
      );
      state = status.readyState;
      process.stdout.write(`    … ${state}\n`);
    }
    if (state === "READY") ok("deployment production READY");
    else {
      fail(`deployment berakhir state=${state} — cek Vercel dashboard`);
      process.exit(1);
    }
  }

  // -------------------------------------------------- 7. simpan ke .env.local
  step(7, total, "Simpan kredensial lokal (.env.local, gitignored)");

  if (DRY_RUN) {
    warn("Dilewati (dry-run)");
  } else {
    upsertEnvLocal({
      SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey,
      MITRA_UPLOAD_SECRET: secrets.mitraUploadSecret,
      SWEEP_SECRET: secrets.sweepSecret,
      CRON_SECRET: secrets.cronSecret,
      APP_URL,
      EMAIL_FROM: process.env.EMAIL_FROM || "",
      RESEND_API_KEY: process.env.RESEND_API_KEY || "",
      BREVO_API_KEY: process.env.BREVO_API_KEY || "",
      ADMIN_SYSTEM_ACTOR_ID: adminUserId,
    });
    ok(".env.local diperbarui (file ini tidak pernah di-commit)");
  }

  log("\n\x1b[1m══ Selesai ══\x1b[0m");
  log("Langkah manual yang tersisa:");
  log("  1. Tambah rule Cloudflare Email Routing: admin@letmehearyou.id → gmail Anda");
  log("  2. node scripts/verify-rls.mjs   → harus 3 PASS");
  log("  3. Login di https://www.letmehearyou.id/login sebagai admin, buka /admin");
  log("  4. Jalankan 21 skenario QA di docs/qa/mitra-intake-admin-qa.md");
  log("  5. Naikkan flag rollout per fase (docs/qa/mitra-intake-rollout-runbook.md)");
  log("");
}

await main();
