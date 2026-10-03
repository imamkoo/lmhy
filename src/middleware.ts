import { NextRequest, NextResponse } from "next/server";

const ROOT_DOMAINS = [
  "letmehearyou.id",
  "www.letmehearyou.id",
  "localhost:3000",
  "localhost:3001",
];

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get("host") || "";

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

  if (subdomain && subdomain !== "www") {
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
