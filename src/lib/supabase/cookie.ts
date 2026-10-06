/**
 * Helper untuk menentukan domain dan opsi cookie sesi Supabase.
 * - Wildcard domain `.letmehearyou.id` agar login terbawa di semua subdomain.
 * - Max-Age 24 jam (86.400 detik) untuk auto-logout timeout.
 */
export function getSessionCookieDomain(hostname?: string): string | undefined {
  const host =
    hostname ||
    (typeof window !== "undefined" ? window.location.hostname : "");

  if (host.endsWith("letmehearyou.id")) {
    return ".letmehearyou.id";
  }

  return undefined;
}

export const SESSION_MAX_AGE = 24 * 60 * 60; // 24 Jam (dalam detik)

export function getSessionCookieOptions(hostname?: string) {
  const domain = getSessionCookieDomain(hostname);
  return {
    path: "/",
    maxAge: SESSION_MAX_AGE,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production" || !!domain,
    ...(domain ? { domain } : {}),
  };
}
