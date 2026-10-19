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
