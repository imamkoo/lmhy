import Link from "next/link";
import { MitraHero, MitraTrackCards } from "@/components/mitra/MitraHero";

export const dynamic = "force-dynamic";

const faqs = [
  [
    "Siapa yang dapat mendaftar?",
    "Psikolog dengan dokumen praktik yang berlaku atau pendamping sebaya yang siap mengikuti batasan etis dan pelatihan.",
  ],
  [
    "Apakah LMHY layanan darurat?",
    "Bukan. Untuk kondisi krisis, gunakan layanan darurat dan rujukan yang tersedia di pakta etika.",
  ],
  [
    "Apa yang diverifikasi?",
    "Tim kami memeriksa identitas, dokumen, pengalaman, dan kesesuaian dengan jalur yang dipilih.",
  ],
  [
    "Berapa biaya untuk mitra?",
    "Paket dan ruang praktik akan diperkenalkan bertahap; mitra baru memulai dari Sapa.",
  ],
  [
    "Bagaimana memeriksa pengajuan?",
    "Masuk ke akun Anda dan buka area Pengajuan. Status tidak dicari melalui email.",
  ],
];

export default function MitraPage() {
  return (
    <main className="min-h-screen bg-[#FBF8F5] px-5 py-14 text-slate-800 md:px-10 md:py-20">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/"
          className="text-sm font-semibold text-[#3C3163] hover:underline"
        >
          ← Kembali ke beranda
        </Link>
        <div className="mt-12">
          <MitraHero />
        </div>
        <section className="mt-14">
          <MitraTrackCards />
        </section>
        <section className="mt-14 rounded-[28px] bg-[#3C3163] p-7 text-white md:p-10">
          <h2 className="text-2xl font-bold">Benefit yang dibangun bersama</h2>
          <div className="mt-6 grid gap-4 text-sm md:grid-cols-2">
            <p>
              <strong>Sebaya</strong>
              <br />
              Sapa gratis · Cerita Rp25.000 · Dengar Rp49.000
            </p>
            <p>
              <strong>Klinis</strong>
              <br />
              Sapa gratis · Cerita Rp59.000 · Dengar Rp129.000
            </p>
          </div>
        </section>
        <section className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-[28px] bg-[hsl(344,81%,87%)] p-7">
            <h2 className="text-2xl font-bold text-[#3C3163]">Etos kami</h2>
            <p className="mt-3 leading-relaxed">
              Keamanan, kerahasiaan, batas kompetensi, dan rujukan bukan sekadar
              formalitas. Baca{" "}
              <Link
                className="font-semibold underline"
                href="/mitra/pakta-etika"
              >
                pakta etika
              </Link>{" "}
              sebelum mendaftar.
            </p>
          </div>
          <div className="rounded-[28px] bg-[hsl(42,73%,74%)] p-7">
            <h2 className="text-2xl font-bold text-[#3C3163]">
              Status pengajuan
            </h2>
            <p className="mt-3 leading-relaxed">
              Sudah mengajukan? Status tersedia setelah Anda masuk ke akun.
            </p>
            <Link
              href="/mitra/status"
              className="mt-5 inline-block font-semibold text-[#3C3163] underline"
            >
              Lihat cara memeriksa status →
            </Link>
          </div>
        </section>
        <section className="mt-14">
          <h2 className="text-3xl font-bold text-[#3C3163]">Pertanyaan umum</h2>
          <div className="mt-6 space-y-4">
            {faqs.map(([q, a]) => (
              <details key={q} className="rounded-2xl bg-white/70 p-5">
                <summary className="cursor-pointer font-semibold text-[#3C3163]">
                  {q}
                </summary>
                <p className="mt-3 leading-relaxed text-slate-600">{a}</p>
              </details>
            ))}
          </div>
        </section>
        <p className="mt-14 text-center font-mono text-xs uppercase tracking-[0.16em] text-slate-500">
          Paket berbayar &amp; ruang praktik segera hadir
        </p>
      </div>
    </main>
  );
}
