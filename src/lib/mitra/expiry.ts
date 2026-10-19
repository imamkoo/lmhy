export const EMAIL_VERIFICATION_TTL_DAYS = 7;
export const APPLICATION_TTL_DAYS = 30;
export const DOCUMENT_RETENTION_DAYS = 90;

const ONE_DAY_MS = 86_400_000;

export function isEmailVerificationExpired(appliedAt: Date, now: Date): boolean {
  return now.getTime() - appliedAt.getTime() >= EMAIL_VERIFICATION_TTL_DAYS * ONE_DAY_MS;
}

export function isApplicationExpired(appliedAt: Date, now: Date): boolean {
  return now.getTime() - appliedAt.getTime() >= APPLICATION_TTL_DAYS * ONE_DAY_MS;
}

export function documentPurgeAfter(decidedAt: Date): Date {
  return new Date(decidedAt.getTime() + DOCUMENT_RETENTION_DAYS * ONE_DAY_MS);
}

export function tombstoneUsername(userId: string): string {
  return "akun-" + userId.replace(/-/g, "").slice(0, 8).toLowerCase();
}

export function isSlaOverdue(
  appliedAt: Date,
  now: Date,
  slaDays: number,
): boolean {
  return now.getTime() - appliedAt.getTime() > slaDays * ONE_DAY_MS;
}
