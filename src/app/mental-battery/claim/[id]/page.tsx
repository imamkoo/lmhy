"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ARCHETYPES, type ArchetypeId } from "@/data/mental-battery/archetypes";

export default function MentalBatteryClaimPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const id = params.id as string;
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [archetype, setArchetype] = useState<any>(null);

  const [form, setForm] = useState({ name: "", email: "", whatsapp: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Token akses tidak valid.");
      setLoading(false);
      return;
    }

    // Simulate "Processing" time for better UX
    const timer = setTimeout(() => {
      fetch(`/api/mental-battery/results/${id}?token=${token}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.error) setError(d.error);
          else setArchetype(d.archetype);
        })
        .catch(() => setError("Gagal memuat hasil."))
        .finally(() => setLoading(false));
    }, 1500);

    return () => clearTimeout(timer);
  }, [id, token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/mental-battery/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resultId: id,
          publicToken: token,
          ...form,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Terjadi kesalahan.");
      }

      router.push(`/mental-battery/result/${id}?token=${token}`);
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-xl py-20 text-center">
        <div className="text-4xl mb-4 animate-bounce">⚡</div>
        <p className="text-xl font-bold" style={{ color: "var(--black-90)" }}>
          Menganalisis Jawabanmu...
        </p>
        <p className="mt-2 text-sm" style={{ color: "var(--black-70)" }}>
          Menghitung Mental Battery dan menentukan Archetype-mu.
        </p>
      </div>
    );
  }

  if (error || !archetype) {
    return (
      <div className="mx-auto max-w-xl py-20 text-center">
        <p className="text-red-600 mb-4">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans" style={{ background: "#FFFDF8", color: "#1E293B" }}>
      {/* Simple Header */}
      <header className="py-6 px-4 max-w-5xl mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/LMHY.png" alt="Let Me Hear You" className="w-10 h-10" />
          <span className="font-bold text-indigo-900 tracking-tight text-lg">Let Me Hear You</span>
        </Link>
      </header>

      <main className="px-4 pb-20">
        <div className="mx-auto max-w-xl space-y-8 animate-in fade-in duration-500 mt-8">
          <div className="text-center space-y-2">
            <p className="text-sm font-medium uppercase tracking-widest text-indigo-500">
              Analisis Selesai
            </p>
            <h1 className="text-3xl font-bold">Kami menemukan archetype-mu!</h1>
          </div>

          {/* Teaser Card */}
          <div className={`rounded-2xl bg-gradient-to-br ${archetype.gradient || 'from-indigo-500 to-purple-600'} p-8 text-white flex flex-col items-center text-center shadow-lg`}>
            {archetype.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={archetype.imageUrl.replace(/^\/uploads\//, "/api/uploads/")} alt={archetype.name} className="w-20 h-20 mb-4 object-cover rounded-xl shadow-sm bg-white/10" />
            ) : (
              <div className="text-7xl mb-4">
                {archetype.emoji}
              </div>
            )}
            <h2 className="text-3xl font-bold">
              {archetype.name}
            </h2>
            <p className="mt-2 text-base opacity-90 italic">
              "{archetype.tagline}"
            </p>
          </div>

          {/* Lead Form */}
          <div className="bg-white rounded-2xl p-6 md:p-8 border-t-4 shadow-[0_4px_20px_rgb(0,0,0,0.04)]" style={{ borderColor: "var(--main-color)" }}>
            <h3 className="text-xl font-bold text-center mb-2 text-slate-800">
              Buka Laporan Lengkapmu
            </h3>
            <p className="text-sm text-center text-slate-500 mb-8 leading-relaxed">
              Masukkan detail di bawah untuk melihat skor Mental Battery %, 4
              sub-metrik, dan penjelasan lengkap tentang kondisimu.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-slate-700">Nama</label>
                <input
                  type="text"
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-shadow"
                  placeholder="Nama panggilanmu"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-slate-700">Email</label>
                <input
                  type="email"
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-shadow"
                  placeholder="email@contoh.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-slate-700">
                  WhatsApp <span className="text-slate-400 font-normal">(opsional)</span>
                </label>
                <input
                  type="tel"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-shadow"
                  placeholder="08123456789"
                  value={form.whatsapp}
                  onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                />
                <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                  <span>🔒</span> Hanya untuk mengirim salinan hasil assessment.
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-indigo-600 text-white py-3.5 mt-6 rounded-xl text-base font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:shadow-none disabled:transform-none"
              >
                {submitting ? "Membuka Hasil..." : "Lihat Hasil Lengkap"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
