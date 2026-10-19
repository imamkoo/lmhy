#!/usr/bin/env node

/**
 * Sweep expired provider applications (daily cron / manual trigger).
 * Usage:
 *   SWEEP_SECRET="secret" APP_URL="http://localhost:3000" node scripts/sweep-expired-applications.mjs
 */

const appUrl = (process.env.APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
const sweepSecret = process.env.SWEEP_SECRET;

if (!sweepSecret) {
  console.error("SWEEP_SECRET is not configured. Exiting.");
  process.exit(1);
}

async function runSweep() {
  console.log(`Triggering expiry sweep at ${appUrl}/api/internal/sweep...`);
  try {
    const res = await fetch(`${appUrl}/api/internal/sweep`, {
      method: "POST",
      headers: {
        "x-sweep-secret": sweepSecret,
        "content-type": "application/json",
      },
    });

    if (!res.ok) {
      console.error(`Sweep failed with HTTP status ${res.status}: ${res.statusText}`);
      const body = await res.text();
      console.error(body);
      process.exit(1);
    }

    const json = await res.json();
    console.log("Sweep completed successfully:");
    console.log(`- Expired emails (>7d): ${json.expiredEmail}`);
    console.log(`- Expired applications (>30d): ${json.expiredApplication}`);
    console.log(`- Released usernames: ${json.releasedUsernames}`);
  } catch (err) {
    console.error("Sweep network or execution error:", err);
    process.exit(1);
  }
}

runSweep();
