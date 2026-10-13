export interface CrisisScanResult {
  flagged: boolean;
  matched: string[];
}

const CRISIS_PATTERNS: readonly string[] = [
  "bunuh diri",
  "mengakhiri hidup",
  "akhiri hidup",
  "ingin mati",
  "pengen mati",
  "mengakhiri semuanya",
  "menyakiti diri",
  "self harm",
  "kill myself",
  "killing myself",
  "end my life",
  "want to die",
  "suicide",
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9 ]/g, "")
    .trim();
}

export function scanForCrisis(text: string | null | undefined): CrisisScanResult {
  const normalized = text ? normalize(text) : "";
  if (!normalized) return { flagged: false, matched: [] };
  const matched = CRISIS_PATTERNS.filter((pattern) => normalized.includes(pattern));
  return { flagged: matched.length > 0, matched };
}
