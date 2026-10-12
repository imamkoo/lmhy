import Link from "next/link";
import ProviderBadge from "./ProviderBadge";

export type DoorwayRole = "COMPANION" | "PROFESSIONAL" | "REFLECTOR" | null;

export interface DoorwayCardProps {
  username: string;
  role: DoorwayRole;
  isVerified: boolean;
  hasSlots: boolean;
}

export default function DoorwayCard({
  username,
  role,
  isVerified,
  hasSlots,
}: DoorwayCardProps) {
  if (!isVerified || (role !== "COMPANION" && role !== "PROFESSIONAL")) {
    return (
      <section className="mt-12 rounded-2xl border border-border bg-card p-5 text-card-foreground sm:p-6">
        <h3 className="text-lg font-bold">Merasa terhubung dengan cerita ini?</h3>
        <p className="mt-2 text-sm leading-relaxed opacity-80">
          Kamu tidak harus melewatinya sendirian.
        </p>
        <Link
          href={`/tenant/${username}`}
          className="mt-4 inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Kunjungi Ruang @{username}
        </Link>
      </section>
    );
  }

  const isProfessional = role === "PROFESSIONAL";
  const sessionLabel = isProfessional ? "Sesi Konseling" : "Sesi Dengar";
  const companionLabel = isProfessional ? "Praktisi" : "Pendamping Sebaya";
  const ctaLabel = hasSlots ? "Ajak Bicara" : "Lihat Jadwal";

  return (
    <section className="mt-12 rounded-2xl border border-border bg-card p-5 text-card-foreground sm:p-6">
      <ProviderBadge role={role} />
      <h3 className="mt-3 text-lg font-bold">
        {sessionLabel} bersama @{username}
      </h3>
      <p className="mt-2 text-sm leading-relaxed opacity-80">
        {sessionLabel} bersama {companionLabel} terverifikasi. Kamu tidak harus
        melewatinya sendirian.
      </p>
      <Link
        href={`/tenant/${username}#sesi-dengar`}
        className="mt-4 inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        {ctaLabel}
      </Link>
    </section>
  );
}
