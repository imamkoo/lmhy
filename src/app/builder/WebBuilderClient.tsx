"use client";

import { useState } from "react";
import Link from "next/link";
import { REFLECTION_TEMPLATES, ReflectionTemplate } from "@/lib/builder-templates";
import { publishTenantArticle } from "@/app/actions/tenant";

export function WebBuilderClient({ initialUsername }: { initialUsername?: string }) {
  const [username, setUsername] = useState(initialUsername || "");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("burnout-recovery");
  const [title, setTitle] = useState(REFLECTION_TEMPLATES[0].defaultTitle);
  const [excerpt, setExcerpt] = useState(REFLECTION_TEMPLATES[0].defaultExcerpt);
  const [content, setContent] = useState(REFLECTION_TEMPLATES[0].content);
  const [tags, setTags] = useState(REFLECTION_TEMPLATES[0].defaultTags);
  const [registerLitera, setRegisterLitera] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-format clean username (alphanumeric, lowercase, hyphen)
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const clean = e.target.value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "")
      .slice(0, 32);
    setUsername(clean);
  };

  const handleSelectTemplate = (template: ReflectionTemplate) => {
    setSelectedTemplateId(template.id);
    if (template.id !== "blank-canvas") {
      setTitle(template.defaultTitle);
      setExcerpt(template.defaultExcerpt);
      setContent(template.content);
      setTags(template.defaultTags);
    } else {
      setTitle("");
      setExcerpt("");
      setContent("");
      setTags("Refleksi, Jurnal, Kesehatan Mental");
    }
  };

  const slugPreview = title
    ? title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .slice(0, 48)
    : "judul-tulisan";

  const cleanUser = username.trim() || "username-kamu";
  const domainPreview = `https://${cleanUser}.letmehearyou.id`;
  const articleUrlPreview = `${domainPreview}/${slugPreview}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError("Silakan isi nama username untuk subdomain Anda terlebih dahulu.");
      return;
    }
    if (!title.trim() || !content.trim()) {
      setError("Judul dan isi refleksi wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await publishTenantArticle({
        username: cleanUser,
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

      // Langsung arahkan ke URL subdomain live pengguna
      const targetUrl = `https://${cleanUser}.letmehearyou.id/${res.slug}`;
      window.location.href = targetUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat mempublikasikan.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl py-8">
      {/* Header Info */}
      <div className="mb-8 text-center sm:text-left">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#d07954] mb-3"
        >
          ← Beranda Let Me Hear You
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Web Builder Refleksi & Subdomain
        </h1>
        <p className="mt-2 text-base text-slate-600">
          Buat ruang publikasi jurnal digital Anda sendiri dalam hitungan detik. Cukup masukkan nama unik, pilih template, dan terbitkan dengan sertifikat resmi Litera Web3.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* LANGKAH 1: IDENTITAS SUBDOMAIN DENGAN LIVE PREVIEW */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#d07954] text-xs font-bold text-white">
              1
            </span>
            <h2 className="text-lg font-bold text-slate-900">
              Tentukan Subdomain Blog Anda
            </h2>
          </div>
          <p className="text-xs text-slate-500 mb-5 ml-8">
            Hanya butuh nama identitas (tanpa login rumit). Subdomain ini akan menjadi alamat permanen blog refleksi Anda.
          </p>

          <div className="grid gap-6 md:grid-cols-12 md:items-center">
            <div className="md:col-span-5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Pilih Username
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-slate-400 font-medium">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={handleUsernameChange}
                  placeholder="contoh: axaa, sarah, amir"
                  required
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50/50 py-3.5 pl-9 pr-4 text-base font-semibold text-slate-900 placeholder:text-slate-400 focus:border-[#d07954] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#d07954]/15 transition"
                />
              </div>
            </div>

            {/* LIVE DOMAIN PREVIEW BADGE */}
            <div className="md:col-span-7">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Live Domain Preview yang Anda Dapatkan
              </label>
              <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/60 p-4 transition-all">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Subdomain Wildcard Aktif (HTTPS)
                </div>
                <div className="mt-1.5 flex flex-col gap-1">
                  <p className="font-mono text-sm font-bold text-emerald-950 truncate">
                    🌐 {domainPreview}
                  </p>
                  <p className="font-mono text-xs text-emerald-700/90 truncate">
                    📄 {articleUrlPreview}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* LANGKAH 2: PILIHAN TEMPLATE REFLEKSI */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#d07954] text-xs font-bold text-white">
              2
            </span>
            <h2 className="text-lg font-bold text-slate-900">
              Pilih Template Tulisan Siap Pakai
            </h2>
          </div>
          <p className="text-xs text-slate-500 mb-6 ml-8">
            Didesain khusus untuk penulisan kesehatan mental dan refleksi diri. Anda dapat mengubah isi template sesuka hati.
          </p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {REFLECTION_TEMPLATES.map((tmpl) => {
              const isSelected = selectedTemplateId === tmpl.id;
              return (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => handleSelectTemplate(tmpl)}
                  className={`flex flex-col text-left rounded-2xl border p-4.5 transition-all ${
                    isSelected
                      ? "border-[#d07954] bg-[#d07954]/5 ring-2 ring-[#d07954]/25 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70"
                  }`}
                >
                  <div className="text-2xl mb-2">{tmpl.icon}</div>
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {tmpl.name}
                  </h3>
                  <p className="mt-1.5 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {tmpl.tagline}
                  </p>
                  <div className="mt-auto pt-3">
                    <span
                      className={`inline-block text-[11px] font-bold ${
                        isSelected ? "text-[#b86644]" : "text-slate-400"
                      }`}
                    >
                      {isSelected ? "✓ Digunakan" : "Gunakan template"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* LANGKAH 3: EDITOR REFLEKSI */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 space-y-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#d07954] text-xs font-bold text-white">
              3
            </span>
            <h2 className="text-lg font-bold text-slate-900">
              Sesuaikan Judul & Isi Tulisan
            </h2>
          </div>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
              ⚠️ {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">
              Judul Refleksi <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Tuliskan judul refleksi yang bermakna..."
              required
              className="w-full rounded-2xl border border-slate-300 px-4 py-3.5 text-slate-900 placeholder:text-slate-400 focus:border-[#d07954] focus:outline-none focus:ring-4 focus:ring-[#d07954]/15 font-semibold text-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">
              Ringkasan Singkat (Excerpt)
            </label>
            <input
              type="text"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Ringkasan atau satu kalimat pengantar..."
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-[#d07954] focus:outline-none focus:ring-4 focus:ring-[#d07954]/15 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">
              Isi Refleksi / Jurnal <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={11}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Ceritakan wawasan atau perjalanan kesehatan mental Anda di sini..."
              required
              className="w-full rounded-2xl border border-slate-300 p-4 text-slate-900 placeholder:text-slate-400 focus:border-[#d07954] focus:outline-none focus:ring-4 focus:ring-[#d07954]/15 leading-relaxed text-base font-sans"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">
              Topik / Tags (Pisahkan dengan koma)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Burnout, Self-Care, Mindfulness"
              className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-[#d07954] focus:outline-none focus:ring-4 focus:ring-[#d07954]/15 text-sm"
            />
          </div>

          {/* LITERA WEB3 SWITCH */}
          <div className="rounded-2xl border border-orange-200/70 bg-[#fbf8f5] p-5">
            <label className="flex items-start gap-3.5 cursor-pointer">
              <input
                type="checkbox"
                checked={registerLitera}
                onChange={(e) => setRegisterLitera(e.target.checked)}
                className="mt-1 h-5 w-5 rounded border-slate-300 text-[#d07954] focus:ring-[#d07954]"
              />
              <div>
                <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <span>💎</span> Aktifkan Sertifikat Digital Web3 (Litera Network di Polygon)
                </span>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                  Otomatis mendaftarkan tulisan Anda ke smart contract Litera. Pembaca dapat mengoleksi bukti baca sebagai sertifikat digital eksklusif.
                </p>
              </div>
            </label>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
            <div className="text-xs text-slate-500">
              Artikel akan terbit langsung di: <strong className="text-slate-800">{domainPreview}</strong>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-[#d07954] px-8 py-3.5 text-base font-bold text-white shadow-md transition hover:bg-[#b86644] disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin text-lg">⏳</span> Mempublikasikan ke Subdomain...
                </>
              ) : (
                <>
                  <span>🚀</span> Terbitkan ke Subdomain Saya
                </>
              )}
            </button>
          </div>
        </section>
      </form>
    </div>
  );
}
