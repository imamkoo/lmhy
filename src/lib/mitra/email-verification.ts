export interface VerificationCallbackParams {
  tokenHash: string;
  type: string;
}

const ALLOWED_OTP_TYPES = new Set(["email", "signup", "magiclink", "email_change"]);

export function parseVerificationParams(
  searchParams: URLSearchParams
): VerificationCallbackParams | null {
  const tokenHash = searchParams.get("token_hash")?.trim() || null;
  const type = searchParams.get("type")?.trim().toLowerCase() || null;
  if (!tokenHash || !type) return null;
  if (!ALLOWED_OTP_TYPES.has(type)) return null;
  return { tokenHash, type };
}

export function safeNextPath(raw: string | null): string {
  if (!raw) return "/akun";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/akun";
  return raw;
}

export function buildVerificationUrl(
  appUrl: string,
  tokenHash: string,
  next = "/akun"
): string {
  const base = appUrl.replace(/\/+$/, "");
  const params = new URLSearchParams({
    token_hash: tokenHash,
    type: "email",
    next: safeNextPath(next),
  });
  return `${base}/auth/callback?${params.toString()}`;
}

export interface VerifiedApplicationRow {
  id: string;
  applied_at: string;
  status: string;
  email_verified_at: string | null;
}

export function selectPendingApplicationsToVerify(
  rows: VerifiedApplicationRow[]
): string[] {
  return rows
    .filter((row) => row.status === "PENDING" && !row.email_verified_at)
    .map((row) => row.id);
}
