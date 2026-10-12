import Link from "next/link";

export type SessionRole = "COMPANION" | "PROFESSIONAL";

export interface SessionSlot {
  id: string;
  start_time: string;
  duration_min: number;
  price_idr: number;
}

export interface SessionTabsProps {
  username: string;
  role: SessionRole;
  slots: SessionSlot[];
}

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Jakarta",
});

const timeFormatter = new Intl.DateTimeFormat("id-ID", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Asia/Jakarta",
});

const numberFormatter = new Intl.NumberFormat("id-ID");

function formatSlotTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return `${dateFormatter.format(date)} · ${timeFormatter.format(date)} WIB`;
}

function formatIdr(value: number): string {
  return `Rp${numberFormatter.format(Math.round(value))}`;
}

export default function SessionTabs({ username, role, slots }: SessionTabsProps) {
  if (role !== "COMPANION" && role !== "PROFESSIONAL") {
    return null;
  }

  const isProfessional = role === "PROFESSIONAL";
  const sessionLabel = isProfessional ? "Sesi Konseling" : "Sesi Dengar";
  const description = isProfessional
    ? `Jadwalkan sesi konseling bersama @${username}. Setiap sesi berlangsung privat dan terjadwal.`
    : `Jadwalkan waktu untuk didengarkan oleh @${username}. Setiap sesi berlangsung privat dan terjadwal.`;

  return (
    <section
      id="sesi-dengar"
      className="mt-8 rounded-2xl border border-border bg-card p-5 text-card-foreground sm:p-6"
    >
      <h2 className="text-lg font-bold">{sessionLabel}</h2>
      <p className="mt-2 text-sm leading-relaxed opacity-80">{description}</p>

      {slots.length === 0 ? (
        <p className="mt-4 rounded-xl border border-border bg-background/40 px-4 py-3 text-sm opacity-80">
          Belum ada jadwal tersedia. Silakan cek kembali nanti.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {slots.map((slot) => (
            <li
              key={slot.id}
              className="flex flex-col gap-3 rounded-xl border border-border bg-background/40 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-semibold">
                  {formatSlotTime(slot.start_time)}
                </p>
                <p className="mt-1 text-xs opacity-70">
                  {slot.duration_min} menit · {formatIdr(slot.price_idr)}
                </p>
              </div>
              <Link
                href={`/tenant/${username}/book/${slot.id}`}
                className="inline-flex shrink-0 items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                Pesan
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
