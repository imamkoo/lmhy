export type ProviderRole = "COMPANION" | "PROFESSIONAL";

export interface ProviderBadgeProps {
  role: ProviderRole;
  className?: string;
}

const ROLE_LABEL: Record<ProviderRole, string> = {
  COMPANION: "Pendamping Sebaya Terverifikasi",
  PROFESSIONAL: "Praktisi Terverifikasi",
};

export default function ProviderBadge({
  role,
  className = "",
}: ProviderBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary ${className}`}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-3.5 w-3.5"
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>
      {ROLE_LABEL[role]}
    </span>
  );
}
