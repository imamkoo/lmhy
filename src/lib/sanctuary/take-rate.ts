export const TAKE_RATE_FLAT_BPS = 1000;
export const TAKE_RATE_FREE_BPS = TAKE_RATE_FLAT_BPS;
export const TAKE_RATE_PRO_BPS = TAKE_RATE_FLAT_BPS;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function resolveTakeRateBps(_tier?: string | null): number {
  return TAKE_RATE_FLAT_BPS;
}
