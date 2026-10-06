import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/types";
import { getSessionCookieOptions } from "@/lib/supabase/cookie";

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
  "/onboarding",
  "/auth",
];

/**
 * Host root production tempat path /tenant/* dialihkan ke subdomain aslinya.
 * localhost sengaja tidak disertakan agar pengembangan lokal tidak
 * ter-redirect ke domain produksi.
 */
const REDIRECT_TENANT_HOSTS = ["letmehearyou.id", "www.letmehearyou.id"];

/** Username subdomain harus aman dipakai sebagai label hostname. */
const SAFE_USERNAME = /^[a-z0-9-]+$/;

function matchesRootRoute(pathname: string): boolean {
  return ROOT_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

export async function middleware(req: NextRequest) {
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

  // (2) Supabase Session & Onboarding Gate Inspection
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let sessionResponse = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  if (supabaseUrl && supabaseAnonKey) {
    const cookieOptions = getSessionCookieOptions(hostname);
    try {
      const supabase = createServerClient<Database>(
        supabaseUrl,
        supabaseAnonKey,
        {
          cookieOptions,
          cookies: {
            getAll() {
              return req.cookies.getAll();
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value }) =>
                req.cookies.set(name, value)
              );
              sessionResponse = NextResponse.next({
                request: {
                  headers: req.headers,
                },
              });
              cookiesToSet.forEach(({ name, value, options }) =>
                sessionResponse.cookies.set(name, value, {
                  ...options,
                  ...(cookieOptions.domain ? { domain: cookieOptions.domain } : {}),
                })
              );
            },
          },
        }
      );

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Hanya gate rute studio/kreator (/builder) yang mewajibkan profil kreator & username.
        // Halaman umum seperti landing page (/), blog (/blog), dll TIDAK boleh membajak pengunjung ke /onboarding.
        const isBuilderPath = url.pathname.startsWith("/builder");

        if (isBuilderPath) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("username")
            .eq("id", user.id)
            .maybeSingle();

          if (!profile?.username) {
            const onboardingUrl = new URL("/onboarding", req.url);
            const redirectResponse = NextResponse.redirect(onboardingUrl);
            sessionResponse.cookies.getAll().forEach((cookie) => {
              redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
            });
            return redirectResponse;
          }
        }
      }
    } catch (authError) {
      console.error("Middleware auth check error:", authError);
    }
  }

  // (3) Subdomain routing
  if (subdomain && subdomain !== "www") {
    // Rute builder di subdomain otomatis diarahkan ke root domain kanonik
    if (url.pathname === "/builder" || url.pathname.startsWith("/builder/")) {
      const canonicalBuilderUrl = new URL(
        `https://www.letmehearyou.id${url.pathname}${url.search}`,
        req.url
      );
      if (!canonicalBuilderUrl.searchParams.has("username")) {
        canonicalBuilderUrl.searchParams.set("username", subdomain);
      }
      return NextResponse.redirect(canonicalBuilderUrl, 307);
    }

    // Legacy /write di subdomain diarahkan ke Web Builder dengan username di root domain
    if (url.pathname === "/write" || url.pathname === "/write/") {
      return NextResponse.redirect(
        new URL(`https://www.letmehearyou.id/builder?username=${subdomain}`, req.url),
        308
      );
    }

    // Route root menang: biarkan dilayani route root, jangan di-rewrite.
    if (matchesRootRoute(url.pathname)) {
      return sessionResponse;
    }

    return NextResponse.rewrite(
      new URL(`/tenant/${subdomain}${url.pathname}`, req.url)
    );
  }

  return sessionResponse;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
