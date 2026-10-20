import type { ApplicationStatus } from "@/lib/mitra/application-state";

export interface QueueItem {
  id: string;
  applicant_name: string;
  applicant_email: string;
  username: string;
  track: "SEBAYA" | "KLINIS";
  status: ApplicationStatus;
  applied_at: string;
  email_verified_at: string | null;
  wa_joined_confirmed_at: string | null;
  pfa_status: "BELUM" | "SEDANG" | "SELESAI";
  details: Record<string, unknown>;
  redFlags: string[];
  ageHours: number;
  needsAction: boolean;
}

export const EMAIL_VERIFY_DEADLINE_MS = 7 * 24 * 60 * 60 * 1000;

export function computeAgeHours(appliedAt: string, now: Date = new Date()): number {
  const appliedTime = new Date(appliedAt).getTime();
  if (Number.isNaN(appliedTime)) return 0;
  return Math.max(0, Math.floor((now.getTime() - appliedTime) / (1000 * 60 * 60)));
}

export function computeRedFlags(
  item: Pick<
    QueueItem,
    "track" | "email_verified_at" | "wa_joined_confirmed_at" | "pfa_status" | "details"
  >
): string[] {
  const flags: string[] = [];

  if (!item.email_verified_at) {
    flags.push("EMAIL BELUM TERVERIFIKASI");
  }

  if (item.track === "SEBAYA") {
    if (!item.wa_joined_confirmed_at) {
      flags.push("WA BELUM DIVERIFIKASI");
    }
    if (item.pfa_status !== "SELESAI") {
      flags.push("PFA BELUM SELESAI");
    }
  }

  if (item.track === "KLINIS") {
    if (item.details?.sip_status === "TIDAK_AKTIF") {
      flags.push("STR TIDAK AKTIF");
    }
  }

  if (
    item.details &&
    typeof item.details.document_count === "number" &&
    item.details.document_count === 0
  ) {
    flags.push("BERKAS KURANG");
  }

  return flags;
}

export function needsAction(
  item: Pick<QueueItem, "applied_at" | "email_verified_at">,
  now: Date = new Date()
): boolean {
  if (item.email_verified_at !== null) return false;
  const appliedTime = new Date(item.applied_at).getTime();
  if (Number.isNaN(appliedTime)) return false;
  return now.getTime() - appliedTime > EMAIL_VERIFY_DEADLINE_MS;
}
