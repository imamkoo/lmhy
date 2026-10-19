import Link from "next/link";

export const metadata = { title: "Pakta Etika Mitra | Let Me Hear You" };

export default function PaktaEtikaPage() {
  return (
    <main className="min-h-screen bg-[#FBF8F5] px-5 py-16 text-slate-800 md:px-10">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/mitra"
          className="text-sm font-semibold text-[#3C3163] hover:underline"
        >
          ← Kembali ke halaman mitra
        </Link>
        <header className="mt-12">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#3C3163]">
            Pakta etika · pledge_version 2026-10-20
          </p>
          <h1 className="mt-4 text-4xl font-bold text-[#3C3163] md:text-5xl">
            Naskah etika untuk setiap mitra
          </h1>
          <p className="mt-5 leading-relaxed text-slate-600">
            Baca dan pahami batas peran sebelum mengirim pengajuan. Dokumen ini
            menjadi bagian dari komitmen kemitraan.
          </p>
        </header>
        <div className="mt-12 space-y-10">
          <section className="rounded-[28px] bg-white/75 p-7 shadow-lg shadow-[#3C3163]/10 md:p-10">
            <h2 className="text-2xl font-bold text-[#3C3163]">
              Kode Etik Praktik Psikologi &amp; Batas Telemedisin
            </h2>
            <div className="mt-5 space-y-4 leading-relaxed text-slate-700">
              <p>
                Praktisi mengikuti prinsip Kode Etik Psikologi Indonesia dan
                ketentuan Himpsi, serta hukum yang berlaku termasuk UU Kesehatan
                17/2023. Praktik hanya dilakukan sesuai kompetensi, pendidikan,
                dan kewenangan berlisensi.
              </p>
              <p>
                Dalam layanan jarak jauh, praktisi wajib menjelaskan batas
                telepraktik, menjaga kerahasiaan, menggunakan kanal yang aman,
                dan memperoleh persetujuan yang dipahami klien. Praktisi tidak
                menjanjikan hasil dan tetap mencatat kebutuhan rujukan.
              </p>
              <p>
                Diagnosis, terapi, dan rekomendasi resep hanya dilakukan dalam
                lingkup kewenangan profesional dan layanan yang tepat. Kondisi
                di luar kompetensi, risiko keselamatan, atau kebutuhan tatap
                muka wajib dirujuk ke fasilitas dan tenaga kesehatan yang
                sesuai.
              </p>
            </div>
          </section>
          <section className="rounded-[28px] bg-[hsl(344,81%,87%)] p-7 md:p-10">
            <h2 className="text-2xl font-bold text-[#3C3163]">
              Pakta Batasan Etis Pendamping Sebaya
            </h2>
            <div className="mt-5 space-y-4 leading-relaxed text-slate-700">
              <p>
                Pendamping hanya menyelenggarakan <strong>Sesi Dengar</strong>:
                hadir, berempati, dan membantu klien menyusun langkah dukungan
                yang aman. Sesi ini bersifat non-klinis.
              </p>
              <p>
                Pendamping dilarang mendiagnosis, melakukan terapi, memberi
                resep, atau mengaku sebagai psikolog maupun tenaga kesehatan.
                Pendamping wajib menjaga kerahasiaan dalam batas keselamatan dan
                merujuk kepada profesional bila kebutuhan klien melampaui
                perannya.
              </p>
              <p>
                Pendamping mengikuti pelatihan First Aid Counseling dan memahami
                protokol krisis. Untuk bantuan krisis, hubungi{" "}
                <strong>LISA 0811-3815-472</strong> atau{" "}
                <strong>Kemenkes 119 ext 8</strong>; bila ada bahaya segera
                gunakan layanan darurat setempat.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
