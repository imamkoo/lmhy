#!/usr/bin/env node

/**
 * Display or guide configuration of Mitra Intake feature flags.
 * Usage:
 *   node scripts/set-mitra-flags.mjs
 */

import fs from "node:fs";
import path from "node:path";

const ENV_FILE = path.resolve(process.cwd(), ".env.local");

function loadEnvLocal() {
  if (!fs.existsSync(ENV_FILE)) return {};
  const content = fs.readFileSync(ENV_FILE, "utf-8");
  const env = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx !== -1) {
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, "");
      env[key] = val;
    }
  }
  return env;
}

const localEnv = loadEnvLocal();

const FLAGS = [
  {
    key: "NEXT_PUBLIC_MITRA_INTAKE_ENABLED",
    desc: "Global intake hub & route switch",
    val: process.env.NEXT_PUBLIC_MITRA_INTAKE_ENABLED ?? localEnv.NEXT_PUBLIC_MITRA_INTAKE_ENABLED ?? "false",
  },
  {
    key: "NEXT_PUBLIC_MITRA_INTAKE_PSIKOLOG_ENABLED",
    desc: "Psychologist clinical track (/mitra/psikolog)",
    val: process.env.NEXT_PUBLIC_MITRA_INTAKE_PSIKOLOG_ENABLED ?? localEnv.NEXT_PUBLIC_MITRA_INTAKE_PSIKOLOG_ENABLED ?? "false",
  },
  {
    key: "NEXT_PUBLIC_MITRA_INTAKE_PENDAMPING_ENABLED",
    desc: "Peer counselor member track (/mitra/pendamping)",
    val: process.env.NEXT_PUBLIC_MITRA_INTAKE_PENDAMPING_ENABLED ?? localEnv.NEXT_PUBLIC_MITRA_INTAKE_PENDAMPING_ENABLED ?? "false",
  },
  {
    key: "MITRA_INTAKE_SHADOW_MODE",
    desc: "Shadow mode (submissions queue, decisions disabled)",
    val: process.env.MITRA_INTAKE_SHADOW_MODE ?? localEnv.MITRA_INTAKE_SHADOW_MODE ?? "false",
  },
  {
    key: "MITRA_INTAKE_WHITELIST_EMAILS",
    desc: "Comma-separated list of allowed emails (empty = open to all)",
    val: process.env.MITRA_INTAKE_WHITELIST_EMAILS ?? localEnv.MITRA_INTAKE_WHITELIST_EMAILS ?? "(empty - all allowed)",
  },
];

console.log("=== Let Me Hear You — Mitra Intake Feature Flags ===");
console.table(
  FLAGS.map((f) => ({
    Flag: f.key,
    Value: f.val,
    Description: f.desc,
  }))
);

console.log("\nTo change flags for local development, edit .env.local.");
console.log("To change flags for production, update Environment Variables in Vercel Dashboard and redeploy.");
console.log("See docs/qa/mitra-intake-admin-qa.md Section 3 for the Rollout Phase Matrix (Phases 0–5).\n");
