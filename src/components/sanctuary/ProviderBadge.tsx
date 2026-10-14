export type ProviderRole = "PENDAMPING" | "PRAKTISI";

export interface ProviderBadgeProps {
  role: ProviderRole;
  className?: string;
}

const ROLE_SHORT_LABEL: Record<ProviderRole, string> = {
  PENDAMPING: "Pendamping",
  PRAKTISI: "Praktisi",
};

const ROLE_FULL_LABEL: Record<ProviderRole, string> = {
  PENDAMPING: "Pendamping Sebaya Terverifikasi",
  PRAKTISI: "Praktisi Terverifikasi",
};

export default function ProviderBadge({
  role,
  className = "",
}: ProviderBadgeProps) {
  const isProfessional = role === "PRAKTISI";
  return (
    <span
      title={ROLE_FULL_LABEL[role]}
      aria-label={ROLE_FULL_LABEL[role]}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold tracking-wide shadow-[0_6px_16px_-8px_rgba(63,55,102,0.55),0_2px_8px_-4px_rgba(63,55,102,0.18),inset_0_1px_0_rgba(255,255,255,0.45)] backdrop-blur-md ${
        isProfessional
          ? "border-[#3f3766]/12 bg-gradient-to-br from-[#3f3766] via-[#5b4fa0] to-[#8a7cc8] text-white"
          : "border-[#3f3766]/10 bg-gradient-to-br from-white via-[#f7f3ff] to-[#efe8ff] text-[#3F3766]"
      } ${className}`}
    >
      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ring-1 backdrop-blur-sm ${
        isProfessional
          ? "bg-white/18 ring-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]"
          : "bg-[#3F3766] ring-[#3F3766]/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]"
      }`}>
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`h-3 w-3 ${isProfessional ? "text-white" : "text-white"}`}
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </span>
      <span className="leading-none">{ROLE_SHORT_LABEL[role]}</span>
      <span aria-hidden="true" className={`h-3 w-px shrink-0 ${isProfessional ? "bg-white/25" : "bg-[#3F3766]/15"}`} />
      <span className={`text-[9px] font-black leading-none tracking-[0.13em] ${isProfessional ? "text-white/80" : "text-[#3F3766]/55"}`}>
        TERVERIFIKASI
      </span>
    </span>
  );
}
