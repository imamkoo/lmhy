import Link from "next/link";

export default function MitraStatusPage() {
  return (
    <main className="min-h-screen bg-[#FBF8F5] px-5 py-16 text-slate-800 md:px-10">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/mitra"
          className="text-sm font-semibold text-[#3C3163] hover:underline"
        >
          ← Kembali ke halaman mitra
        </Link>
        <div className="mt-16 rounded-[28px] bg-white/75 p-8 shadow-xl shadow-[#3C3163]/10 md:p-12">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#3C3163]">
            Status pengajuan
          </p>
          <h1 className="mt-4 text-4xl font-bold text-[#3C3163]">
            Cek status setelah masuk
          </h1>
          <p className="mt-5 leading-relaxed text-slate-600">
            Status pengajuan dapat dilihat setelah akun Anda dibuat. Demi
            menjaga privasi, kami tidak menyediakan form pencarian status
            berdasarkan email.
          </p>
          <Link
            href="/login?next=/akun/pengajuan"
            className="mt-8 inline-flex rounded-full bg-[#3C3163] px-6 py-3 font-semibold text-white"
          >
            Masuk &amp; lihat status →
          </Link>
          <p className="mt-6 text-sm text-slate-600">
            Belum punya akun?{" "}
            <Link
              href="/mitra/psikolog"
              className="font-semibold text-[#3C3163] underline"
            >
              Ajukan diri sebagai mitra
            </Link>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
