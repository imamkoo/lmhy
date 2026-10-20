#!/usr/bin/env node

/**
 * Trigger task cron internal LMHY lewat HTTP.
 * Usage:
 *   SWEEP_SECRET="secret" APP_URL="https://letmehearyou.id" node scripts/sweep-expired-applications.mjs
 *   SWEEP_SECRET="secret" APP_URL="https://letmehearyou.id" node scripts/sweep-expired-applications.mjs purge-documents
 */

const TASKS = {
  sweep: {
    path: "/api/internal/sweep",
    describe: "Sweep kedaluwarsa pengajuan mitra",
    report: (json) => [
      `Expired emails (>7d): ${json.expiredEmail ?? 0}`,
      `Expired applications (>30d): ${json.expiredApplication ?? 0}`,
      `Released usernames: ${json.releasedUsernames ?? 0}`,
    ],
  },
  "purge-documents": {
    path: "/api/internal/purge-documents",
    describe: "Purge dokumen kredensial lewat 90 hari",
    report: (json) => [
      `Purged documents: ${json.purged ?? 0}`,
      `Errors: ${json.errors ?? 0}`,
    ],
  },
};

const appUrl = (
  process.env.APP_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "http://localhost:3000"
).replace(/\/$/, "");
const sweepSecret = process.env.SWEEP_SECRET || process.env.CRON_SECRET;
const taskName = process.argv[2] || "sweep";

if (!sweepSecret) {
  console.error("SWEEP_SECRET (atau CRON_SECRET) is not configured. Exiting.");
  process.exit(1);
}

if (!TASKS[taskName]) {
  console.error(
    `Unknown task "${taskName}". Available: ${Object.keys(TASKS).join(", ")}`
  );
  process.exit(1);
}

const task = TASKS[taskName];

async function run() {
  console.log(`Triggering ${task.describe} at ${appUrl}${task.path}...`);
  try {
    const res = await fetch(`${appUrl}${task.path}`, {
      method: "POST",
      headers: {
        "x-sweep-secret": sweepSecret,
        "content-type": "application/json",
      },
    });

    if (!res.ok) {
      console.error(
        `Task failed with HTTP status ${res.status}: ${res.statusText}`
      );
      const body = await res.text();
      console.error(body);
      process.exit(1);
    }

    const json = await res.json();
    console.log(`${task.describe} completed successfully:`);
    for (const line of task.report(json)) {
      console.log(`- ${line}`);
    }
  } catch (err) {
    console.error("Task network or execution error:", err);
    process.exit(1);
  }
}

run();
