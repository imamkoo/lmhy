import fs from "node:fs";

const PAT = fs.readFileSync(`${process.env.HOME}/.config/lmhy-supabase-pat`, "utf8").trim();
const REF = "wzywhjsxrbkgoxaingar";
const API = `https://api.supabase.com/v1/projects/${REF}/config/auth`;


const NEXT_BY_TYPE = {
  confirmation: { type: "email", next: "/akun" },
  magic_link: { type: "email", next: "/akun" },
  recovery: { type: "recovery", next: "/reset-password" },
  email_change: { type: "email", next: "/akun" },
  invite: { type: "email", next: "/akun" },
};

const appLog = [];

async function getConfig() {
  const res = await fetch(API, { headers: { Authorization: `Bearer ${PAT}` } });
  if (!res.ok) throw new Error(`GET ${res.status}: ${await res.text()}`);
  return res.json();
}

function rewrite(template, nextPath, otpType) {
  const replacement =
    `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=${otpType}` +
    `&next=${encodeURIComponent(nextPath)}`;
  return template.split("{{ .ConfirmationURL }}").join(replacement);
}

const dryRun = process.argv.includes("--dry-run");

const cfg = await getConfig();
const updates = {};

async function applyTemplateFixes() {
  for (const [name, { type: otpType, next: nextPath }] of Object.entries(
    NEXT_BY_TYPE
  )) {
    const key = `mailer_templates_${name}_content`;
    const current = cfg[key];
    if (!current) continue;

    const expected =
      `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=${otpType}` +
      `&next=${encodeURIComponent(nextPath)}`;
    if (current.includes(expected) && !current.includes("{{ .SiteURL }}{{ .SiteURL }}")) {
      appLog.push(`${key}: sudah benar (type=${otpType})`);
      continue;
    }

    const rewritten = current.includes("{{ .ConfirmationURL }}")
      ? rewrite(current, nextPath, otpType)
      : current
          .split("{{ .SiteURL }}{{ .SiteURL }}")
          .join("{{ .SiteURL }}")
          .replace(
            /(\.SiteURL \}\})?\/auth\/callback\?token_hash=\{\{ \.TokenHash \}\}&type=\w+/,
            `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=${otpType}`
          )
          .replace(/&next=[^"]*/, `&next=${encodeURIComponent(nextPath)}`);

    updates[key] = rewritten;
    appLog.push(`${key}: diperbaiki -> type=${otpType} next=${nextPath}`);
  }
}

await applyTemplateFixes();

if (Object.keys(updates).length === 0) {
  appLog.push("Tidak ada template yang perlu diubah.");
} else if (dryRun) {
  appLog.push(`[DRY RUN] ${Object.keys(updates).length} template akan diperbarui.`);
} else {
  const res = await fetch(API, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${PAT}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error(`PATCH ${res.status}: ${await res.text()}`);
  const after = await getConfig();
  for (const key of Object.keys(updates)) {
    const val = after[key] || "";
    const authLinks = val.match(/\/auth\/callback\?token_hash=/g) ?? [];
    const siteUrlCount = val.match(/\{\{ \.SiteURL \}\}\/auth\/callback/g)?.length ?? 0;
    const ok =
      authLinks.length > 0 &&
      siteUrlCount === authLinks.length &&
      !val.includes("{{ .ConfirmationURL }}") &&
      !val.includes("{{ .SiteURL }}{{ .SiteURL }}") &&
      val.includes("{{ .SiteURL }}");
    appLog.push(`${key}: ${ok ? "TERVERIFIKASI" : "GAGAL VERIFIKASI"}`);
  }
}

console.log(appLog.join("\n"));
