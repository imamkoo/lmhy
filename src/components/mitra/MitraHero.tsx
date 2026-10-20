import Link from "next/link";
import { isTrackEnabled } from "@/lib/mitra/flags";

type Track = {
  title: string;
  description: string;
  requirements: string[];
  href: string;
  action: string;
};

const tracks: Track[] = [
  {
    title: "Praktisi Psikolog",
    description:
      "Bawa keahlian klinis Anda ke ruang refleksi yang aman dan terarah.",
    requirements: [
      "Gelar S2 Psikologi",
      "STR/SIPP yang aktif",
      "Unggah dokumen verifikasi",
    ],
    href: "/mitra/psikolog",
    action: "Daftar sebagai psikolog",
  },
  {
    title: "Pendamping Sebaya",
    description:
      "Dengarkan cerita dengan empati, batasan yang jelas, dan dukungan komunitas.",
    requirements: [
      "Motivasi mendampingi",
      "Bergabung di grup WhatsApp",
      "Bersedia mengikuti pelatihan First Aid",
    ],
    href: "/mitra/pendamping",
    action: "Daftar sebagai pendamping",
  },
];

export function MitraHero() {
  return (
    <header className="mx-auto max-w-3xl text-center">
      <p className="font-mono text-xs font-bold uppercase tracking-[0.22em] text-[#3C3163]">
        Program Mitra
      </p>
      <h1 className="mt-5 text-4xl font-bold tracking-tight text-[#3C3163] md:text-6xl">
        Bergabung sebagai Mitra Let Me Hear You
      </h1>
      <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">
        Bantu lebih banyak orang menemukan ruang untuk didengar—dengan jalur
        kontribusi yang sesuai keahlian dan batasan etis Anda.
      </p>
    </header>
  );
}

export function MitraTrackCards() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {tracks.map((track) => (
        <article
          key={track.title}
          className="rounded-[28px] border border-white/80 bg-white/70 p-7 shadow-xl shadow-[#3C3163]/10"
        >
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#3C3163]">
            Jalur mitra
          </p>
          <h2 className="mt-3 text-2xl font-bold text-[#3C3163]">
            {track.title}
          </h2>
          <p className="mt-3 leading-relaxed text-slate-600">
            {track.description}
          </p>
          <ul className="mt-6 space-y-3 text-sm text-slate-700">
            {track.requirements.map((requirement) => (
              <li key={requirement}>✓ {requirement}</li>
            ))}
          </ul>
          {isTrackEnabled(
            track.title === "Pendamping Sebaya" ? "SEBAYA" : "KLINIS",
          ) ? (
            <Link
              href={track.href}
              className="mt-7 inline-flex rounded-full bg-[#3C3163] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              {track.action} →
            </Link>
          ) : (
            <span className="mt-7 inline-flex rounded-full bg-slate-200 px-5 py-3 text-sm font-semibold text-slate-600">
              Segera hadir
            </span>
          )}
        </article>
      ))}
    </div>
  );
}
