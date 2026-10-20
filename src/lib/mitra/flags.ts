export function isMitraIntakeEnabled(): boolean {
  return process.env.NEXT_PUBLIC_MITRA_INTAKE_ENABLED === "true";
}

export function isTrackEnabled(track: "SEBAYA" | "KLINIS"): boolean {
  if (!isMitraIntakeEnabled()) return false;
  const env =
    track === "SEBAYA"
      ? process.env.NEXT_PUBLIC_MITRA_INTAKE_PENDAMPING_ENABLED
      : process.env.NEXT_PUBLIC_MITRA_INTAKE_PSIKOLOG_ENABLED;
  return env !== "false";
}

export function isEmailWhitelisted(email: string): boolean {
  const list = (process.env.MITRA_INTAKE_WHITELIST_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (list.length === 0) return true;
  return list.includes((email || "").trim().toLowerCase());
}

export function isShadowMode(): boolean {
  return process.env.MITRA_INTAKE_SHADOW_MODE === "true";
}
