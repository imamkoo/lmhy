"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function MentalBatteryClaimPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const id = params.id as string;
  const token = searchParams.get("token");

  const [error, setError] = useState<string | null>(!token ? "Token akses tidak valid." : null);
  const [loading, setLoading] = useState(!!token);
  const [archetype, setArchetype] = useState<{name: string; emoji?: string; imageUrl?: string; tagline: string; gradient: string} | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({ name: "", email: "", whatsapp: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      return;
    }

    fetch(`/api/mental-battery/results/${id}?token=${token}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setArchetype(d.archetype);
      })
      .catch(() => setError("Gagal memuat hasil."))
      .finally(() => setLoading(false));
  }, [id, token]);

  function validateForm(): boolean {
    const errors: Record<string, string> = {};
    
    if (!form.name.trim() || form.name.trim().length < 2) {
      errors.name = "Nama minimal 2 karakter.";
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email.trim() || !emailRegex.test(form.email.trim())) {
      errors.email = "Email tidak valid.";
    }
    
    if (form.whatsapp.trim() && !/^[0-9+]{8,15}$/.test(form.whatsapp.replace(/[\s-]/g, ""))) {
      errors.whatsapp = "Nomor WhatsApp tidak valid.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/mental-battery/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resultId: id,
          publicToken: token,
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          whatsapp: form.whatsapp.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Terjadi kesalahan.");
      }

      router.push(`/mental-battery/result/${id}?token=${token}`);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Terjadi kesalahan yang tidak diketahui.");
      }
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-xl py-32 text-center">
        <svg className="animate-spin h-8 w-8 text-indigo-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-lg font-bold text-slate-700">Memuat data...</p>
      </div>
    );
  }

  if (error && !archetype) {
    return (
      <div className="mx-auto max-w-xl py-32 text-center px-4">
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl mb-6">
          <p className="font-semibold">{error}</p>
        </div>
        <Link href="/mental-battery" className="inline-block bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition">
          Kembali ke Utama
        </Link>
      </div>
    );
  }

  return (
    <main className="px-4 pb-20 pt-6">
      <div className="mx-auto max-w-xl space-y-8 mt-4">
        <div className="text-center space-y-2">
          <span className="inline-block bg-indigo-50 text-indigo-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Analisis Selesai
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Kami menemukan archetype-mu!</h1>
        </div>

        {archetype && (
          <div className={`rounded-3xl bg-gradient-to-br ${archetype.gradient || 'from-indigo-500 to-purple-600'} p-8 text-white flex flex-col items-center text-center shadow-xl relative overflow-hidden`}>
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
            {archetype.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={archetype.imageUrl.replace(/^\/uploads\//, "/api/uploads/")} alt={archetype.name} className="w-20 h-20 mb-4 object-cover rounded-2xl shadow-md bg-white/10 border-2 border-white/20 relative z-10" />
            ) : (
              <div className="text-7xl mb-4 relative z-10">{archetype.emoji}</div>
            )}
            <h2 className="text-3xl font-black relative z-10">{archetype.name}</h2>
            <p className="mt-2 text-base opacity-90 italic relative z-10">&ldquo;{archetype.tagline}&rdquo;</p>
          </div>
        )}

        <div className="bg-white rounded-3xl p-6 md:p-8 border-t-4 border-indigo-600 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <h3 className="text-xl font-bold text-center mb-2 text-slate-800">
            Buka Laporan Lengkapmu
          </h3>
          <p className="text-sm text-center text-slate-500 mb-8 leading-relaxed">
            Masukkan detail di bawah untuk melihat skor Mental Battery %, 4 sub-metrik, rekomendasi personal, dan penjelasan lengkap tentang kondisimu.
          </p>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-medium border border-red-100 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold mb-1.5 text-slate-700">Nama</label>
              <input
                type="text"
                required
                className={`w-full rounded-xl border-2 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-shadow ${
                  fieldErrors.name ? "border-red-300 bg-red-50/50" : "border-slate-200"
                }`}
                placeholder="Nama panggilanmu"
                value={form.name}
                onChange={(e) => {
                  setForm({ ...form, name: e.target.value });
                  if (fieldErrors.name) setFieldErrors((p) => { const c = {...p}; delete c.name; return c; });
                }}
              />
              {fieldErrors.name && <p className="text-xs text-red-500 mt-1.5 font-medium">{fieldErrors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5 text-slate-700">Email</label>
              <input
                type="email"
                required
                className={`w-full rounded-xl border-2 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-shadow ${
                  fieldErrors.email ? "border-red-300 bg-red-50/50" : "border-slate-200"
                }`}
                placeholder="email@contoh.com"
                value={form.email}
                onChange={(e) => {
                  setForm({ ...form, email: e.target.value });
                  if (fieldErrors.email) setFieldErrors((p) => { const c = {...p}; delete c.email; return c; });
                }}
              />
              {fieldErrors.email && <p className="text-xs text-red-500 mt-1.5 font-medium">{fieldErrors.email}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5 text-slate-700">
                WhatsApp <span className="text-slate-400 font-normal">(opsional)</span>
              </label>
              <input
                type="tel"
                className={`w-full rounded-xl border-2 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-shadow ${
                  fieldErrors.whatsapp ? "border-red-300 bg-red-50/50" : "border-slate-200"
                }`}
                placeholder="08123456789"
                value={form.whatsapp}
                onChange={(e) => {
                  setForm({ ...form, whatsapp: e.target.value });
                  if (fieldErrors.whatsapp) setFieldErrors((p) => { const c = {...p}; delete c.whatsapp; return c; });
                }}
              />
              {fieldErrors.whatsapp && <p className="text-xs text-red-500 mt-1.5 font-medium">{fieldErrors.whatsapp}</p>}
              <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                <span>🔒</span> Hanya untuk mengirim salinan hasil assessment.
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-indigo-900 text-white py-4 mt-6 rounded-2xl text-base font-bold shadow-xl shadow-indigo-900/20 hover:bg-indigo-800 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:shadow-none disabled:transform-none flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Membuka Hasil...
                </>
              ) : "Lihat Hasil Lengkap"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
