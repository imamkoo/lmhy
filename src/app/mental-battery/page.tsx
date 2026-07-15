import Link from "next/link";
import { ARCHETYPE_LIST } from "@/data/mental-battery/archetypes";
import { TOTAL_QUESTIONS } from "@/data/mental-battery/questions-id";

export default function MentalBatteryIntroPage() {
  const estimatedMinutes = Math.ceil(TOTAL_QUESTIONS * 0.3);

  return (
    <main className="px-4 pb-20">
      <div className="max-w-3xl mx-auto text-center mt-10 md:mt-16 mb-16">
        <div className="inline-block bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-full text-sm font-bold mb-6 border border-indigo-100">
          Cek Kondisi Mentalmu Gratis
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight mb-6">
          Kenali <span className="text-indigo-600">Mental Battery</span>-mu Hari Ini.
        </h1>
        <p className="text-lg md:text-xl text-slate-600 mb-8 max-w-2xl mx-auto leading-relaxed">
          Hanya butuh {estimatedMinutes} menit untuk mengecek tingkat stres, fokus, dan beban emosimu. Dapatkan hasil personal dan panduan langkah selanjutnya.
        </p>

        <Link
          href="/mental-battery/quiz"
          className="inline-block bg-indigo-600 text-white px-8 py-4 rounded-full text-lg font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-1 transition-all duration-200"
        >
          Mulai Assessment Sekarang
        </Link>
        <p className="mt-4 text-xs text-slate-400 flex items-center justify-center gap-1">
          <span className="text-sm">🔒</span> Data privasimu 100% aman dan dirahasiakan.
        </p>
      </div>

      <div className="max-w-4xl mx-auto mt-20">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-3">Temukan Archetype-mu</h2>
          <p className="text-slate-500 max-w-lg mx-auto">Ada 8 profil kondisi mental yang umum terjadi. Mana yang paling menggambarkan dirimu saat ini?</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {ARCHETYPE_LIST.map((a) => (
            <div
              key={a.id}
              className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_2px_10px_rgb(0,0,0,0.03)] text-center hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="text-5xl mb-4">{a.emoji}</div>
              <h3 className="font-bold text-slate-800 text-sm mb-2">{a.name}</h3>
              <p className="text-xs text-slate-500 leading-relaxed italic">{a.tagline}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto mt-24">
        <div className="bg-indigo-900 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden shadow-2xl shadow-indigo-900/20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600 rounded-full blur-3xl opacity-30 -mr-20 -mt-20" />

          <div className="relative z-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-8">Apa yang akan kamu dapatkan?</h2>
            <ul className="space-y-6">
              <li className="flex items-start gap-4">
                <div className="bg-white/20 p-2 rounded-xl text-xl shrink-0">🎯</div>
                <div>
                  <strong className="block text-indigo-50 text-lg mb-1">Skor Mental Battery Akurat</strong>
                  <span className="text-sm text-indigo-200 leading-relaxed block">Diukur menggunakan kombinasi 3 instrumen validasi psikologi global (PHQ-9, GAD-7, DASS-21).</span>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="bg-white/20 p-2 rounded-xl text-xl shrink-0">📊</div>
                <div>
                  <strong className="block text-indigo-50 text-lg mb-1">Analisa 4 Sub-Metrik</strong>
                  <span className="text-sm text-indigo-200 leading-relaxed block">Melihat lebih detail pada level stres, skor pemulihan, kapasitas fokus, dan total beban emosi.</span>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="bg-white/20 p-2 rounded-xl text-xl shrink-0">💡</div>
                <div>
                  <strong className="block text-indigo-50 text-lg mb-1">Rekomendasi Personal</strong>
                  <span className="text-sm text-indigo-200 leading-relaxed block">Dapatkan langkah actionable yang benar-benar disesuaikan dengan pola kebiasaan dan kondisimu.</span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto mt-16 p-5 bg-amber-50 border border-amber-100 rounded-2xl text-center text-sm text-amber-800 shadow-sm">
        <strong className="block mb-1 text-amber-900">Penafian Penting</strong>
        Alat skrining ini dirancang untuk refleksi mandiri, bukan sebagai alat diagnosis klinis. Jika kamu merasa dalam krisis atau butuh penanganan profesional, segera kunjungi halaman <Link href="/emergency" className="underline font-bold hover:text-amber-900">Bantuan Darurat</Link>.
      </div>
    </main>
  );
}
