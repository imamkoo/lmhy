import { NextRequest, NextResponse } from "next/server";

const ROOT_DOMAINS = [
  "letmehearyou.id",
  "www.letmehearyou.id",
  "localhost:3000",
  "localhost:3001",
];

/**
 * Route root yang harus dilayani oleh route aslinya saat diakses dari
 * subdomain. Tanpa daftar ini, middleware me-rewrite SEMUA path menjadi
 * /tenant/<sub><path>, sehingga /builder ditangkap catch-all
 * [username]/[slug] dan merender artikel placeholder — bukan Studio Canvas.
 *
 * Kecocokan persis atau diikuti "/":  "/builder" ✅   "/builderx" ❌
 * Sama pola dengan guard `write` di tenant/[username]/[slug]/page.tsx.
 */
const ROOT_ROUTES = [
  "/builder",
  "/blog",
  "/creator",
  "/admin",
  "/login",
];

/**
 * Host root production tempat path /tenant/* dialihkan ke subdomain aslinya.
 * localhost sengaja tidak disertakan agar pengembangan lokal tidak
 * ter-redirect ke domain produksi.
 */
const REDIRECT_TENANT_HOSTS = ["letmehearyou.id", "www.letmehearyou.id"];

/** Username subdomain harus aman dipakai sebagai label hostname. */
const SAFE_USERNAME = /^[A-Za-z0-9_-]+$/;

function matchesRootRoute(pathname: string): boolean {
  return ROOT_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get("host") || "";

  // (1) Host root production: /tenant/<user>/... -> https://<user>.letmehearyou.id/...
  // Ditempatkan sebelum guard agar path bertitik tetap ikut ter-redirect.
  if (REDIRECT_TENANT_HOSTS.includes(hostname)) {
    const match = url.pathname.match(/^\/tenant\/([^/]+)(\/.*)?$/);
    const username = match?.[1];
    if (username && SAFE_USERNAME.test(username)) {
      const rest = match![2] || "/";
      // Jika mengakses /tenant/<user>/write -> langsung arahkan ke builder
      if (rest === "/write" || rest === "/write/") {
        return NextResponse.redirect(
          new URL(`https://${username}.letmehearyou.id/builder?username=${username}`, url),
          308
        );
      }
      return NextResponse.redirect(
        new URL(`https://${username}.letmehearyou.id${rest}${url.search}`, url),
        308
      );
    }
  }

  if (
    url.pathname.startsWith("/_next") ||
    url.pathname.startsWith("/api") ||
    url.pathname.startsWith("/assets") ||
    url.pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  let subdomain: string | null = null;
  const isRootDomain = ROOT_DOMAINS.some((domain) => hostname === domain);

  if (!isRootDomain) {
    if (hostname.includes(".letmehearyou.id")) {
      subdomain = hostname.replace(".letmehearyou.id", "").split(":")[0];
    } else if (hostname.includes(".localhost")) {
      subdomain = hostname.replace(".localhost", "").split(":")[0];
    }
  }

  // Jika mengakses /write langsung di root domain -> arahkan ke /builder
  if (isRootDomain && (url.pathname === "/write" || url.pathname === "/write/")) {
    return NextResponse.redirect(new URL("/builder", req.url), 308);
  }

  if (subdomain && subdomain !== "www") {
    // Legacy /write di subdomain diarahkan ke Web Builder dengan username
    if (url.pathname === "/write" || url.pathname === "/write/") {
      return NextResponse.redirect(
        new URL(`/builder?username=${subdomain}`, req.url),
        308
      );
    }

    // (2) Route root menang: biarkan dilayani route root, jangan di-rewrite.
    if (matchesRootRoute(url.pathname)) {
      return NextResponse.next();
    }

    return NextResponse.rewrite(
      new URL(`/tenant/${subdomain}${url.pathname}`, req.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
