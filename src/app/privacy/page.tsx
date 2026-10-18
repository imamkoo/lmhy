import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Kebijakan Privasi | Let Me Hear You",
  description:
    "Cara Let Me Hear You mengumpulkan, menggunakan, dan melindungi data Anda — termasuk cookie, analitik, dan login Google/Facebook.",
  alternates: {
    canonical: "/privacy",
  },
};

const LAST_UPDATED = "7 Oktober 2026";

const SECTIONS: { title: string; content: ReactNode }[] = [
  {
    title: "Pendahuluan",
    content: (
      <p>
        Kebijakan ini menjelaskan bagaimana Let Me Hear You (&quot;LMHY&quot;)
        mengumpulkan, menggunakan, dan melindungi informasi Anda saat mengakses
        letmehearyou.id dan menggunakan layanannya. Dengan menggunakan situs
        ini, Anda menyetujui praktik yang dijelaskan di sini.
      </p>
    ),
  },
  {
    title: "Data yang kami kumpulkan",
    content: (
      <ul className="list-disc space-y-1.5 pl-5">
        <li>
          <strong>Informasi akun</strong> — email, nama, dan foto profil yang
          Anda berikan saat mendaftar atau masuk melalui Google maupun Facebook.
        </li>
        <li>
          <strong>Profil dan konten publik</strong> — username, bio, tautan,
          komentar, serta interaksi mengikuti yang Anda buat di platform.
        </li>
        <li>
          <strong>Data teknis</strong> — alamat IP, jenis perangkat, browser,
          dan halaman yang dikunjungi, dicatat secara agregat melalui Google
          Analytics.
        </li>
        <li>
          <strong>Data sesi</strong> — cookie sesi yang menjaga Anda tetap
          masuk dan melindungi akun selama menggunakan layanan.
        </li>
      </ul>
    ),
  },
  {
    title: "Bagaimana kami menggunakan data",
    content: (
      <p>
        Data dipakai untuk menyediakan dan mempersonalisasi layanan, menjaga
        keamanan akun, memahami pola penggunaan secara agregat agar layanan
        dapat diperbaiki, serta menghubungi Anda terkait akun atau perubahan
        penting pada layanan.
      </p>
    ),
  },
  {
    title: "Cookie dan analitik",
    content: (
      <p>
        Situs ini menggunakan cookie sesi (dari infrastruktur Supabase, bersifat
        httpOnly) agar Anda tetap masuk, serta cookie Google Analytics
        (<code className="rounded bg-slate-100 px-1 text-sm">_ga</code>) untuk
        statistik kunjungan. Anda dapat menolak cookie melalui setelan browser
        atau memasang Google Analytics Opt-out Add-on.
      </p>
    ),
  },
  {
    title: "Masuk dengan pihak ketiga",
    content: (
      <p>
        Anda dapat masuk menggunakan Google atau Facebook melalui Supabase.
        Kami hanya menerima identitas dasar (email, nama, dan foto profil) dan
        tidak pernah melihat maupun menyimpan kata sandi Anda. Kebijakan privasi
        masing-masing penyedia:{" "}
        <a
          href="https://policies.google.com/privacy"
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-[#3F3766] underline underline-offset-4"
        >
          Google
        </a>{" "}
        dan{" "}
        <a
          href="https://www.facebook.com/privacy/policy/"
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-[#3F3766] underline underline-offset-4"
        >
          Facebook
        </a>
        .
      </p>
    ),
  },
  {
    title: "Penyimpanan dan keamanan",
    content: (
      <p>
        Data disimpan pada infrastruktur Supabase (cloud) dan dilindungi dengan
        enkripsi selama transit (HTTPS) serta pembatasan akses. Kami tidak
        menjual, menyewakan, atau memperdagangkan data Anda kepada pihak mana
        pun.
      </p>
    ),
  },
  {
    title: "Dengan siapa data dibagikan",
    content: (
      <p>
        Hanya seperlunya: Supabase (infrastruktur data), Google (analitik dan
        login), Meta/Facebook (login), dan pihak berwenang jika diwajibkan oleh
        hukum yang berlaku.
      </p>
    ),
  },
  {
    title: "Hak Anda",
    content: (
      <p>
        Anda berhak mengakses, memperbarui, atau menghapus data dan akun Anda.
        Untuk permintaan hapus akun, hubungi email kami di bawah. Anda juga
        dapat menarik izin login kapan saja melalui pengaturan Akun Google atau
        Facebook Anda, dan mengelola cookie melalui browser.
      </p>
    ),
  },
  {
    title: "Anak di bawah umur",
    content: (
      <p>
        Layanan ini tidak ditujukan bagi anak usia di bawah 13 tahun. Jika kami
        mengetahui data anak di bawah usia tersebut dikumpulkan tanpa izin yang
        semestinya, data akan dihapus.
      </p>
    ),
  },
  {
    title: "Kesehatan mental",
    content: (
      <p>
        LMHY adalah alat edukasi dan refleksi mandiri — bukan layanan medis,
        psikologis, diagnosis, atau bantuan darurat. Jika Anda atau orang di
        sekitar Anda berada dalam kondisi darurat, segera hubungi layanan
        darurat setempat (misalnya 112 atau 119).
      </p>
    ),
  },
  {
    title: "Perubahan kebijakan",
    content: (
      <p>
        Kebijakan ini dapat diperbarui sewaktu-waktu. Tanggal berlaku terbaru
        selalu dicantumkan di halaman ini; perubahan material akan diumumkan
        secara jelas.
      </p>
    ),
  },
  {
    title: "Kontak",
    content: (
      <p>
        Pertanyaan, permintaan data, atau masukan apa pun dapat dikirim ke{" "}
        <a
          href="mailto:imamkholidubaidillah16@gmail.com"
          className="font-semibold text-[#3F3766] underline underline-offset-4"
        >
          imamkholidubaidillah16@gmail.com
        </a>
        .
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#fbf8f5] px-5 py-16 text-slate-900 md:px-10">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/"
          className="text-sm font-semibold text-[#3F3766] hover:underline"
        >
          ← Kembali ke Beranda
        </Link>
        <header className="mb-12 mt-10 max-w-2xl">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-[#3F3766]">
            Kebijakan Privasi
          </p>
          <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
            Privasi Anda, dijaga dengan sungguh-sungguh.
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-slate-600">
            Terakhir diperbarui: {LAST_UPDATED}
          </p>
        </header>
        <div className="max-w-3xl space-y-9">
          {SECTIONS.map((section) => (
            <section key={section.title}>
              <h2 className="text-xl font-bold text-[#3F3766]">
                {section.title}
              </h2>
              <div className="mt-3 space-y-3 text-base leading-relaxed text-slate-700">
                {section.content}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
