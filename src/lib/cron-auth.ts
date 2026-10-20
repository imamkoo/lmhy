export interface CronSecretEnv {
  SWEEP_SECRET?: string;
  CRON_SECRET?: string;
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

function matches(candidate: string | null, secret: string | undefined): boolean {
  if (!candidate || !secret) return false;
  return timingSafeEqual(candidate, secret);
}

/**
 * Mengotorisasi request cron internal.
 *
 * Mendukung tiga cara pemanggilan:
 * - Vercel Cron  -> GET dengan header `Authorization: Bearer $CRON_SECRET`
 * - GitHub Actions -> POST dengan header `x-sweep-secret: $SWEEP_SECRET`
 * - curl manual  -> salah satu dari keduanya
 */
export function isAuthorizedCronRequest(
  request: Request,
  env: CronSecretEnv = {
    SWEEP_SECRET: process.env.SWEEP_SECRET,
    CRON_SECRET: process.env.CRON_SECRET,
  }
): boolean {
  const sweepSecret = env.SWEEP_SECRET;
  const cronSecret = env.CRON_SECRET;
  if (!sweepSecret && !cronSecret) return false;

  const headerSecret = request.headers.get("x-sweep-secret");
  if (matches(headerSecret, sweepSecret) || matches(headerSecret, cronSecret)) {
    return true;
  }

  const authorization = request.headers.get("authorization");
  const bearer = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : null;
  return matches(bearer, sweepSecret) || matches(bearer, cronSecret);
}
