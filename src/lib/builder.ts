import { siteUrl } from "@/lib/site";

/**
 * Helper untuk membangun URL Studio Canvas / Web Builder.
 * Menghasilkan URL kanonik di root domain (misal: https://www.letmehearyou.id/builder?username=...)
 * agar sesi login dan otentikasi kreator selalu terpusat di domain utama.
 */
export function getBuilderUrl(username?: string): string {
  const query = username ? `?username=${encodeURIComponent(username)}` : "";
  return `${siteUrl}/builder${query}`;
}
