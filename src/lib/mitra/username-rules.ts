import {
  MAX_USERNAME_LENGTH,
  MIN_USERNAME_LENGTH,
  RESERVED_USERNAMES,
  USERNAME_REGEX,
} from "@/lib/auth-constants";

const MITRA_EXTRA_RESERVED = [
  "artikel",
  "articles",
  "mitra",
  "praktik",
  "akun",
  "pengaturan",
  "pengajuan",
  "terms",
  "images",
  "media",
  "upload",
  "uploads",
  "cdn",
  "sapa",
  "cerita",
  "dengar",
  "status",
];

export const MITRA_RESERVED_USERNAMES = new Set([
  ...RESERVED_USERNAMES,
  ...MITRA_EXTRA_RESERVED,
]);

export interface UsernameValidation {
  valid: boolean;
  error?: string;
}

export function isReservedMitraUsername(raw: string): boolean {
  return MITRA_RESERVED_USERNAMES.has(raw.trim().toLowerCase());
}

export function validateMitraUsername(raw: string): UsernameValidation {
  const username = (raw || "").trim();
  if (!username) return { valid: false, error: "Username wajib diisi." };
  if (username.length < MIN_USERNAME_LENGTH) {
    return { valid: false, error: `Username minimal ${MIN_USERNAME_LENGTH} karakter.` };
  }
  if (username.length > MAX_USERNAME_LENGTH) {
    return { valid: false, error: `Username maksimal ${MAX_USERNAME_LENGTH} karakter.` };
  }
  if (!USERNAME_REGEX.test(username)) {
    return { valid: false, error: "Username hanya boleh memuat huruf kecil (a-z), angka (0-9), dan tanda hubung (-)." };
  }
  if (username.startsWith("-") || username.endsWith("-")) {
    return { valid: false, error: "Username tidak boleh diawali atau diakhiri tanda hubung (-)." };
  }
  if (username.includes("--")) {
    return { valid: false, error: "Username tidak boleh memuat tanda hubung ganda (--)." };
  }
  if (isReservedMitraUsername(username)) {
    return { valid: false, error: "Username ini dipakai oleh sistem. Silakan pilih yang lain." };
  }
  return { valid: true };
}

export function suggestUsernames(raw: string, isTaken: (candidate: string) => boolean): string[] {
  const base = (raw || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 20);
  if (!base || isReservedMitraUsername(base)) return [];
  const out: string[] = [];
  const candidates = [base, `${base}-1`, `${base}-2`, `${base}-3`, `${base}-psikolog`, `${base}-santoso`];
  for (const c of candidates) {
    if (out.length >= 3) break;
    if (validateMitraUsername(c).valid && !isTaken(c)) out.push(c);
  }
  return out;
}
