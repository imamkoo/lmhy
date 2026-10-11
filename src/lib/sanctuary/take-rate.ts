export const TAKE_RATE_FREE_BPS = 1000;
export const TAKE_RATE_PRO_BPS = 500;

export function resolveTakeRateBps(tier: "FREE" | "PRO" | string | null | undefined): number {
  return tier === "PRO" ? TAKE_RATE_PRO_BPS : TAKE_RATE_FREE_BPS;
}
