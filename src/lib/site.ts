const FALLBACK_SITE_URL = "https://letmehearyou.id";

/**
 * URL publik situs, dipakai untuk sitemap, robots, canonical, dan OpenGraph.
 * Diambil dari NEXT_PUBLIC_SITE_URL agar bisa berbeda antara local, preview, dan production.
 */
export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || FALLBACK_SITE_URL).replace(/\/$/, "");
