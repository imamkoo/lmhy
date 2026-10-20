import type {
  MitraDraft,
  PendampingDraft,
  PsikologDraft,
} from "@/lib/mitra/application-schema";

export const FIXTURE_PASSWORD = "rahasia123";

export function psikologValidFixture(): PsikologDraft {
  return {
    track: "KLINIS",
    applicantName: "Budi Santoso",
    applicantEmail: "budi@contoh.id",
    whatsapp: "081234567890",
    domicileProvince: "DKI Jakarta",
    domicileCity: "Jakarta Selatan",
    username: "budi-santoso-psikolog",
    password: FIXTURE_PASSWORD,
    academicTitle: "S.Psi",
    s2Campus: "Universitas Indonesia",
    s2GraduationYear: 2018,
    specialization: "Klinis Dewasa",
    strNumber: "1234567890",
    sipStatus: "AKTIF",
    currentPractice: "Klinik Sehat Jiwa",
    yearsExperience: "5 tahun",
    flightHours: "1500 jam",
    modalities: ["VIDEO", "CHAT"],
    motivation:
      "Saya ingin bergabung sebagai mitra psikolog klinis untuk membantu masyarakat mendapatkan layanan konseling kesehatan mental yang profesional, terjangkau, dan amanah melalui platform ini secara berkelanjutan dan berintegritas tinggi.",
    ethicsAccepted: true,
    dataAccuracyAccepted: true,
    honeypot: "",
    formElapsedMs: 9000,
  };
}

export function pendampingValidFixture(): PendampingDraft {
  return {
    track: "SEBAYA",
    applicantName: "Siti Rahma",
    applicantEmail: "siti@contoh.id",
    whatsapp: "081298765432",
    domicileProvince: "Jawa Barat",
    domicileCity: "Bandung",
    username: "siti-rahma-sebaya",
    password: FIXTURE_PASSWORD,
    backgroundTrack: "PENYINTAS",
    personalExperience:
      "Saya adalah penyintas gangguan kecemasan yang telah pulih dan aktif mendampingi teman sebaya di komunitas selama lebih dari 2 tahun.",
    availability: "Malam hari (19:00 - 22:00)",
    motivation:
      "Saya terdorong untuk menjadi pendamping sebaya karena percaya bahwa pengalaman pemulihan saya dapat memberikan harapan dan ruang aman bagi mereka yang sedang berjuang menghadapi masa-masa sulit dalam hidup mereka saat ini.",
    ethicsAccepted: true,
    dataAccuracyAccepted: true,
    waGroupConfirmed: true,
    pfaCommitment: true,
    honeypot: "",
    formElapsedMs: 8000,
  };
}

export function validDraft(): MitraDraft {
  return {
    track: "KLINIS",
    applicantName: "Budi Santoso",
    applicantEmail: "budi@contoh.id",
    whatsapp: "081234567890",
    domicileProvince: "DKI Jakarta",
    domicileCity: "Jakarta Selatan",
    username: "budi-santoso",
    password: FIXTURE_PASSWORD,
    academicTitle: "M.Psi",
    s2Campus: "Universitas Indonesia",
    s2GraduationYear: 2020,
    specialization: "Umum",
    strNumber: "STR123",
    sipStatus: "AKTIF",
    currentPractice: "Klinik",
    yearsExperience: "5 tahun",
    flightHours: "",
    modalities: ["VIDEO"],
    motivation: "a".repeat(200),
    ethicsAccepted: true,
    dataAccuracyAccepted: true,
  };
}
