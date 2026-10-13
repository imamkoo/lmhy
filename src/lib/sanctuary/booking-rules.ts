const PROVIDER_ROLES = new Set(["PENDAMPING", "PRAKTISI"]);

export interface ProviderEligibility {
  creator_role?: string | null;
  verification_status?: string | null;
}

export function canProviderCreateSlot(profile: ProviderEligibility): boolean {
  return profile.verification_status === "APPROVED" && PROVIDER_ROLES.has(profile.creator_role ?? "");
}

export function isSlotReservationExpired(reservedUntil: string | null | undefined, now: Date): boolean {
  if (!reservedUntil) return true;
  const expiry = new Date(reservedUntil);
  if (Number.isNaN(expiry.getTime())) return true;
  return expiry.getTime() <= now.getTime();
}
