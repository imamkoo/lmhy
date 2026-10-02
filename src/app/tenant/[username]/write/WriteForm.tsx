"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { publishTenantArticle } from "@/app/actions/tenant";

export function WriteForm({ username }: { username: string }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("Refleksi, Kesehatan Mental");
  const [registerLitera, setRegisterLitera] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError("Judul dan konten tulisan wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await publishTenantArticle({
        username,
        title,
        excerpt,
        content,
        tags,
        registerLitera,
      });

      if (!res.success) {
        setError(res.error || "Gagal menerbitkan artikel.");
        setIsSubmitting(false);
        return;
      }

      // Redirect to the newly created article
      router.push(`/${res.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
    >
      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-sm font-medium text-red-800 border border-red-200">
          ⚠️ {error}
        </div>
      )}

      {/* Judul Artikel */}
      <div>
        <label className="block text-sm font-bold text-slate-800">
          Judul Refleksi <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Misal: Menemukan Kedamaian di Tengah Riuh"
          required
          className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-[#d07954] focus:outline-none focus:ring-2 focus:ring-[#d07954]/20"
        />
      </div>

      {/* Ringkasan Singkat */}
      <div>
        <label className="block text-sm font-bold text-slate-800">
          Ringkasan Singkat (Excerpt)
        </label>
        <input
          type="text"
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          placeholder="Satu atau dua kalimat pengantar untuk pembaca..."
          className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-[#d07954] focus:outline-none focus:ring-2 focus:ring-[#d07954]/20"
        />
      </div>

      {/* Tags / Kategori */}
      <div>
        <label className="block text-sm font-bold text-slate-800">
          Topik / Tags (Pisahkan dengan koma)
        </label>
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="Burnout, Self-Care, Meditasi"
          className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-[#d07954] focus:outline-none focus:ring-2 focus:ring-[#d07954]/20"
        />
      </div>

      {/* Isi Tulisan */}
      <div>
        <label className="block text-sm font-bold text-slate-800">
          Isi Tulisan / Refleksi <span className="text-red-500">*</span>
        </label>
        <textarea
          rows={10}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Tuliskan cerita, jurnal, atau wawasan kesehatan mental Anda di sini..."
          required
          className="mt-2 w-full rounded-xl border border-slate-300 p-4 text-slate-900 placeholder:text-slate-400 focus:border-[#d07954] focus:outline-none focus:ring-2 focus:ring-[#d07954]/20 leading-relaxed font-sans"
        />
      </div>

      {/* Litera Web3 Toggle */}
      <div className="rounded-xl border border-orange-100 bg-[#fbf8f5] p-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={registerLitera}
            onChange={(e) => setRegisterLitera(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-slate-300 text-[#d07954] focus:ring-[#d07954]"
          />
          <div>
            <span className="text-sm font-bold text-slate-900">
              Sertakan Widget Sertifikat Digital Litera (Polygon Web3)
            </span>
            <p className="mt-1 text-xs text-slate-600">
              Otomatis mendaftarkan artikel ke protokol Litera agar pembaca dapat mengoleksi sertifikat digital kepemilikan dan membaca konten eksklusif Anda.
            </p>
          </div>
        </label>
      </div>

      {/* Tombol Terbitkan */}
      <div className="flex items-center justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-xl bg-[#d07954] px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#b86644] disabled:opacity-50"
        >
          {isSubmitting ? "Menerbitkan..." : "Publikasikan Tulisan 🚀"}
        </button>
      </div>
    </form>
  );
}
