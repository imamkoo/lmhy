export type SeverityLevel = "rendah" | "sedang" | "tinggi" | "sangat_tinggi";

export const SEVERITY_LABELS: Record<
  SeverityLevel,
  { label: string; emoji: string; color: string }
> = {
  rendah: { label: "Rendah", emoji: "🌿", color: "text-green-600" },
  sedang: { label: "Sedang", emoji: "🌤", color: "text-yellow-600" },
  tinggi: { label: "Tinggi", emoji: "☁️", color: "text-orange-600" },
  sangat_tinggi: { label: "Sangat Tinggi", emoji: "⛈", color: "text-red-600" },
};

export const BATTERY_STATUS_LABELS: Record<
  "charged" | "stabil" | "draining" | "low_power" | "critical",
  { label: string; color: string }
> = {
  charged: { label: "Terisi Penuh", color: "text-green-600" },
  stabil: { label: "Stabil", color: "text-blue-600" },
  draining: { label: "Mulai Menurun", color: "text-yellow-600" },
  low_power: { label: "Rendah", color: "text-orange-600" },
  critical: { label: "Kritis", color: "text-red-600" },
};
