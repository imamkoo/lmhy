/**
 * Helper untuk menentukan domain cookie sesi Supabase.
 * Di production (domain letmehearyou.id), cookie di-set dengan wildcard `.letmehearyou.id`
 * agar sesi login pengguna aktif di seluruh subdomain (*.letmehearyou.id).
 * Di localhost / preview vercel non-custom domain, domain cookie dibiarkan undefined.
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

export function getSessionCookieOptions(hostname?: string) {
  const domain = getSessionCookieDomain(hostname);
  return {
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production" || !!domain,
    ...(domain ? { domain } : {}),
  };
}
