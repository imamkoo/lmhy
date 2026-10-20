export type ApplicationStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "EXPIRED"
  | "SUPERSEDED";

export function canTransitionApplication(
  from: ApplicationStatus,
  to: ApplicationStatus,
): boolean {
  if (from !== "PENDING") {
    return false;
  }
  return (
    to === "APPROVED" ||
    to === "REJECTED" ||
    to === "EXPIRED" ||
    to === "SUPERSEDED"
  );
}

export interface ApprovalInput {
  status: ApplicationStatus;
  track: "SEBAYA" | "KLINIS";
  emailVerifiedAt: string | null;
  waJoinedConfirmedAt: string | null;
  pfaStatus: "BELUM" | "SEDANG" | "SELESAI";
  hasRequiredDocuments: boolean;
  adminUserId: string;
  applicantUserId: string;
  note?: string;
}

export interface GateResult {
  allowed: boolean;
  reasons: string[];
}

export function evaluateApproval(input: ApprovalInput): GateResult {
  const reasons: string[] = [];

  if (input.status !== "PENDING") {
    reasons.push("Hanya status PENDING yang dapat disetujui.");
  }

  if (input.adminUserId === input.applicantUserId) {
    reasons.push("Admin tidak boleh menyetujui pengajuannya sendiri.");
  }

  if (!input.emailVerifiedAt) {
    reasons.push("Alamat email belum terverifikasi.");
  }

  if (!input.hasRequiredDocuments) {
    reasons.push("Dokumen persyaratan belum lengkap.");
  }

  if (input.track === "SEBAYA") {
    if (!input.waJoinedConfirmedAt) {
      reasons.push("Konfirmasi bergabung grup WhatsApp mitra belum diverifikasi.");
    }
    if (input.pfaStatus !== "SELESAI") {
      reasons.push("Pelatihan Psychological First Aid (PFA) belum selesai.");
    }
  }

  return {
    allowed: reasons.length === 0,
    reasons,
  };
}

export function evaluateRejection(input: {
  status: ApplicationStatus;
  note: string;
  adminUserId: string;
  applicantUserId: string;
}): GateResult {
  const reasons: string[] = [];

  if (input.status !== "PENDING") {
    reasons.push("Hanya status PENDING yang dapat ditolak.");
  }

  if (input.adminUserId === input.applicantUserId) {
    reasons.push("Admin tidak boleh menolak pengajuannya sendiri.");
  }

  const trimmed = (input.note || "").trim();
  if (trimmed.length < 10) {
    reasons.push("Catatan penolakan wajib diisi minimal 10 karakter.");
  }

  return {
    allowed: reasons.length === 0,
    reasons,
  };
}

export function roleForTrack(
  track: "SEBAYA" | "KLINIS",
): "PENDAMPING" | "PRAKTISI" {
  return track === "SEBAYA" ? "PENDAMPING" : "PRAKTISI";
}

export function serviceTrackForTrack(
  track: "SEBAYA" | "KLINIS",
): "SEBAYA" | "KLINIS" {
  return track === "SEBAYA" ? "SEBAYA" : "KLINIS";
}
