import { validateMitraUsername } from "@/lib/mitra/username-rules";

export type MitraTrack = "SEBAYA" | "KLINIS";

export interface ValidationIssue {
  field: string;
  message: string;
}

export interface PsikologDraft {
  track: "KLINIS";
  applicantName: string;
  applicantEmail: string;
  whatsapp: string;
  domicileProvince: string;
  domicileCity: string;
  username: string;
  password: string;
  academicTitle: string;
  s2Campus: string;
  s2GraduationYear: number;
  specialization: string;
  strNumber: string;
  sipStatus: "AKTIF" | "TIDAK_AKTIF";
  currentPractice: string;
  yearsExperience: string;
  flightHours: string;
  modalities: string[];
  motivation: string;
  ethicsAccepted: boolean;
  dataAccuracyAccepted: boolean;
  honeypot?: string;
  formElapsedMs?: number;
}

export interface PendampingDraft {
  track: "SEBAYA";
  applicantName: string;
  applicantEmail: string;
  whatsapp: string;
  domicileProvince: string;
  domicileCity: string;
  username: string;
  password: string;
  backgroundTrack: "PENYINTAS" | "PEMERHATI" | "MAHASISWA" | "LAINNYA";
  motivation: string;
  personalExperience: string;
  availability: string;
  ethicsAccepted: boolean;
  dataAccuracyAccepted: boolean;
  waGroupConfirmed: boolean;
  pfaCommitment: boolean;
  honeypot?: string;
  formElapsedMs?: number;
}

export type MitraDraft = PsikologDraft | PendampingDraft;

export interface NormalizedApplication {
  track: MitraTrack;
  applicantName: string;
  applicantEmail: string;
  whatsapp: string;
  domicileProvince: string;
  domicileCity: string;
  username: string;
  backgroundTrack: string | null;
  motivation: string;
  details: Record<string, unknown>;
  ethicsAcceptedAt: string;
}

const DISPOSABLE_EMAIL_DOMAINS = new Set([
  "mailinator.com",
  "tempmail.com",
  "10minutemail.com",
  "guerrillamail.com",
  "yopmail.com",
]);

const ALLOWED_SPECIALIZATIONS = new Set([
  "Klinis Dewasa",
  "Klinis Anak & Remaja",
  "Klinis Keluarga",
  "Industri & Organisasi",
  "Pendidikan",
  "Umum",
]);

const ALLOWED_MODALITIES = new Set(["VIDEO", "VOICE", "CHAT"]);

const ALLOWED_BACKGROUND_TRACKS = new Set([
  "PENYINTAS",
  "PEMERHATI",
  "MAHASISWA",
  "LAINNYA",
]);

function normalizeWhatsappDigits(raw: string): string {
  const digitsOnly = (raw || "").replace(/[\s\-+]/g, "");
  if (digitsOnly.startsWith("62")) {
    return "0" + digitsOnly.slice(2);
  }
  return digitsOnly;
}

function validateCommonDraft(draft: MitraDraft): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  const name = (draft.applicantName || "").trim();
  if (!name) {
    issues.push({ field: "applicantName", message: "Nama lengkap wajib diisi." });
  } else if (name.length < 3 || name.length > 80) {
    issues.push({ field: "applicantName", message: "Nama lengkap harus antara 3 hingga 80 karakter." });
  }

  const email = (draft.applicantEmail || "").trim().toLowerCase();
  if (!email) {
    issues.push({ field: "applicantEmail", message: "Alamat email wajib diisi." });
  } else if (email.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    issues.push({ field: "applicantEmail", message: "Format alamat email tidak valid." });
  } else {
    const domain = email.split("@")[1];
    if (domain && DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
      issues.push({ field: "applicantEmail", message: "Domain email sementara (disposable) tidak diizinkan." });
    }
  }

  const cleanedWa = (draft.whatsapp || "").replace(/[\s\-+]/g, "");
  if (!cleanedWa) {
    issues.push({ field: "whatsapp", message: "Nomor WhatsApp wajib diisi." });
  } else if (!/^(?:62|0)8[1-9][0-9]{6,10}$/.test(cleanedWa)) {
    issues.push({ field: "whatsapp", message: "Nomor WhatsApp Indonesia tidak valid." });
  }

  const province = (draft.domicileProvince || "").trim();
  if (!province) {
    issues.push({ field: "domicileProvince", message: "Provinsi domisili wajib diisi." });
  } else if (province.length > 60) {
    issues.push({ field: "domicileProvince", message: "Provinsi domisili maksimal 60 karakter." });
  }

  const city = (draft.domicileCity || "").trim();
  if (!city) {
    issues.push({ field: "domicileCity", message: "Kota/kabupaten domisili wajib diisi." });
  } else if (city.length > 60) {
    issues.push({ field: "domicileCity", message: "Kota/kabupaten domisili maksimal 60 karakter." });
  }

  const uv = validateMitraUsername(draft.username);
  if (!uv.valid) {
    issues.push({ field: "username", message: uv.error || "Username tidak valid." });
  }

  const pwd = draft.password || "";
  if (pwd.length < 8 || !/[a-zA-Z]/.test(pwd) || !/[0-9]/.test(pwd)) {
    issues.push({ field: "password", message: "Kata sandi minimal 8 karakter dan memuat kombinasi huruf serta angka." });
  }

  const motivation = (draft.motivation || "").trim();
  if (motivation.length < 200) {
    issues.push({ field: "motivation", message: "Motivasi minimal 200 karakter." });
  } else if (motivation.length > 2000) {
    issues.push({ field: "motivation", message: "Motivasi maksimal 2000 karakter." });
  }

  if (draft.honeypot && draft.honeypot.trim().length > 0) {
    issues.push({ field: "honeypot", message: "Pengajuan terdeteksi sebagai spam." });
  }

  if (typeof draft.formElapsedMs === "number" && draft.formElapsedMs < 5000) {
    issues.push({ field: "formElapsedMs", message: "Formulir dikirim terlalu cepat." });
  }

  if (!draft.ethicsAccepted) {
    issues.push({ field: "ethicsAccepted", message: "Anda wajib menyetujui kode etik mitra." });
  }

  if (!draft.dataAccuracyAccepted) {
    issues.push({ field: "dataAccuracyAccepted", message: "Anda wajib menyetujui kebenaran data yang diberikan." });
  }

  return issues;
}

export function validatePsikologDraft(draft: PsikologDraft, now?: Date): ValidationIssue[] {
  const issues = validateCommonDraft(draft);

  if (!(draft.academicTitle || "").trim()) {
    issues.push({ field: "academicTitle", message: "Gelar akademik wajib diisi." });
  }

  if (!(draft.s2Campus || "").trim()) {
    issues.push({ field: "s2Campus", message: "Kampus S2 Profesi Psikologi wajib diisi." });
  }

  const currentYear = (now || new Date()).getFullYear();
  if (
    typeof draft.s2GraduationYear !== "number" ||
    !draft.s2GraduationYear ||
    draft.s2GraduationYear < 1980 ||
    draft.s2GraduationYear > currentYear
  ) {
    issues.push({
      field: "s2GraduationYear",
      message: `Tahun kelulusan S2 harus antara 1980 hingga ${currentYear}.`,
    });
  }

  const specialization = (draft.specialization || "").trim();
  if (!specialization || !ALLOWED_SPECIALIZATIONS.has(specialization)) {
    issues.push({ field: "specialization", message: "Spesialisasi klinis tidak valid atau belum dipilih." });
  }

  if (!(draft.strNumber || "").trim()) {
    issues.push({ field: "strNumber", message: "Nomor STR aktif wajib diisi." });
  }

  if (draft.sipStatus !== "AKTIF" && draft.sipStatus !== "TIDAK_AKTIF") {
    issues.push({ field: "sipStatus", message: "Status SIP harus AKTIF atau TIDAK_AKTIF." });
  }

  if (!(draft.currentPractice || "").trim()) {
    issues.push({ field: "currentPractice", message: "Tempat praktik saat ini wajib diisi." });
  }

  if (!(draft.yearsExperience || "").trim()) {
    issues.push({ field: "yearsExperience", message: "Pengalaman praktik wajib diisi." });
  }

  if (!Array.isArray(draft.modalities) || draft.modalities.length === 0) {
    issues.push({ field: "modalities", message: "Pilih minimal satu modalitas layanan." });
  } else if (!draft.modalities.every((m) => ALLOWED_MODALITIES.has(m))) {
    issues.push({ field: "modalities", message: "Modalitas layanan hanya boleh VIDEO, VOICE, atau CHAT." });
  }

  return issues;
}

export function validatePendampingDraft(draft: PendampingDraft, now?: Date): ValidationIssue[];
export function validatePendampingDraft(draft: PendampingDraft): ValidationIssue[] {
  const issues = validateCommonDraft(draft);

  if (!draft.backgroundTrack || !ALLOWED_BACKGROUND_TRACKS.has(draft.backgroundTrack)) {
    issues.push({ field: "backgroundTrack", message: "Latar belakang jalur pendamping sebaya tidak valid atau belum dipilih." });
  }

  const personalExp = (draft.personalExperience || "").trim();
  if (personalExp.length < 80) {
    issues.push({ field: "personalExperience", message: "Pengalaman personal minimal 80 karakter." });
  }

  if (!(draft.availability || "").trim()) {
    issues.push({ field: "availability", message: "Ketersediaan waktu pendampingan wajib diisi." });
  }

  if (!draft.waGroupConfirmed) {
    issues.push({ field: "waGroupConfirmed", message: "Anda wajib bersedia bergabung ke grup koordinasi WhatsApp." });
  }

  if (!draft.pfaCommitment) {
    issues.push({ field: "pfaCommitment", message: "Anda wajib berkomitmen mengikuti pelatihan Psychological First Aid (PFA)." });
  }

  return issues;
}

export function validateMitraDraft(
  draft: MitraDraft,
  now?: Date
): {
  ok: boolean;
  issues: ValidationIssue[];
  normalized?: NormalizedApplication;
} {
  const issues =
    draft.track === "KLINIS"
      ? validatePsikologDraft(draft, now)
      : validatePendampingDraft(draft, now);

  if (issues.length > 0) {
    return { ok: false, issues };
  }

  const normalizedWa = normalizeWhatsappDigits(draft.whatsapp);

  const normalized: NormalizedApplication = {
    track: draft.track,
    applicantName: draft.applicantName.trim(),
    applicantEmail: draft.applicantEmail.trim().toLowerCase(),
    whatsapp: normalizedWa,
    domicileProvince: draft.domicileProvince.trim(),
    domicileCity: draft.domicileCity.trim(),
    username: draft.username.trim().toLowerCase(),
    backgroundTrack: draft.track === "SEBAYA" ? draft.backgroundTrack : null,
    motivation: draft.motivation.trim(),
    details:
      draft.track === "KLINIS"
        ? {
            academic_title: draft.academicTitle.trim(),
            s2_campus: draft.s2Campus.trim(),
            s2_graduation_year: draft.s2GraduationYear,
            specialization: draft.specialization.trim(),
            str_number: draft.strNumber.trim(),
            sip_status: draft.sipStatus,
            current_practice: draft.currentPractice.trim(),
            years_experience: draft.yearsExperience.trim(),
            flight_hours: (draft.flightHours || "").trim(),
            modalities: [...draft.modalities],
          }
        : {
            background_track: draft.backgroundTrack,
            personal_experience: draft.personalExperience.trim(),
            availability: draft.availability.trim(),
            wa_group_confirmed: draft.waGroupConfirmed,
            pfa_commitment: draft.pfaCommitment,
          },
    ethicsAcceptedAt: (now || new Date()).toISOString(),
  };

  return { ok: true, issues: [], normalized };
}
