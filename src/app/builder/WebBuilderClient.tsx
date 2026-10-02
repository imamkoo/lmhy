"use client";

import { useState } from "react";
import Link from "next/link";
import { REFLECTION_TEMPLATES, ReflectionTemplate } from "@/lib/builder-templates";
import { publishTenantArticle } from "@/app/actions/tenant";
import { LiteraLoginModal } from "@/components/litera/LiteraLoginModal";

export function WebBuilderClient({ initialUsername }: { initialUsername?: string }) {
  const [username, setUsername] = useState(initialUsername || "");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("burnout-recovery");
  const [title, setTitle] = useState(REFLECTION_TEMPLATES[0].defaultTitle);
  const [excerpt, setExcerpt] = useState(REFLECTION_TEMPLATES[0].defaultExcerpt);
  const [content, setContent] = useState(REFLECTION_TEMPLATES[0].content);
  const [tags, setTags] = useState(REFLECTION_TEMPLATES[0].defaultTags);
  
  // Litera Web3 Optional Toggle & Account State
  const [registerLitera, setRegisterLitera] = useState(true);
  const [creatorWallet, setCreatorWallet] = useState<string>("");
  const [loginMethod, setLoginMethod] = useState<string>("");
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<string>("");
  const [newCollectionName, setNewCollectionName] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeBaseDomain] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return window.location.hostname.includes("letmehearyou.my.id")
        ? "letmehearyou.my.id"
        : "letmehearyou.id";
    }
    return "letmehearyou.id";
  });

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

  const handleToggleLitera = (enabled: boolean) => {
    setRegisterLitera(enabled);
    if (enabled && !creatorWallet) {
      setIsLoginModalOpen(true);
    }
  };

  const handleLoginSuccess = (walletAddress: string, method: string) => {
    setCreatorWallet(walletAddress);
    setLoginMethod(method);
    setRegisterLitera(true);
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
  const domainPreview = `https://${cleanUser}.${activeBaseDomain}`;
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

    if (registerLitera && !creatorWallet) {
      setIsLoginModalOpen(true);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const finalCollection =
        selectedCollection === "__new__"
          ? newCollectionName.trim()
          : selectedCollection || "Let Me Hear You - Jurnal & Refleksi";

      const res = await publishTenantArticle({
        username: cleanUser,
        title,
        excerpt,
        content,
        tags,
        registerLitera,
        creatorAddress: creatorWallet || undefined,
        collectionName: finalCollection,
      });

      if (!res.success) {
        setError(res.error || "Gagal menerbitkan artikel.");
        setIsSubmitting(false);
        return;
      }

      // Langsung arahkan ke URL subdomain live pengguna sesuai domain yang sedang aktif
      const targetUrl = `https://${cleanUser}.${activeBaseDomain}/${res.slug}`;
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
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#3F3766]/70 hover:text-[#3F3766] mb-3"
        >
          ← Beranda Let Me Hear You
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-[#3F3766] sm:text-4xl">
          Web Builder Refleksi & Subdomain
        </h1>
        <p className="mt-2 text-base text-[#3F3766]/75">
          Buat ruang publikasi jurnal digital Anda sendiri dalam hitungan detik. Cukup masukkan nama unik, pilih template, dan terbitkan dengan sertifikat resmi Litera Web3.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* LANGKAH 1: IDENTITAS SUBDOMAIN DENGAN LIVE PREVIEW */}
        <section className="rounded-3xl border border-[#3F3766]/10 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F7ABC5] text-xs font-bold text-[#3F3766]">
              1
            </span>
            <h2 className="text-lg font-bold text-[#3F3766]">
              Tentukan Subdomain Blog Anda
            </h2>
          </div>
          <p className="text-xs text-[#3F3766]/60 mb-5 ml-8">
            Hanya butuh nama identitas (tanpa login rumit). Subdomain ini akan menjadi alamat permanen blog refleksi Anda.
          </p>

          <div className="grid gap-6 md:grid-cols-12 md:items-center">
            <div className="md:col-span-5">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#3F3766]/75 mb-2">
                Pilih Username
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-[#3F3766]/40 font-medium">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={handleUsernameChange}
                  placeholder="contoh: axaa, sarah, amir"
                  required
                  className="w-full rounded-2xl border border-[#3F3766]/15 bg-[#F5E7C6]/40 py-3.5 pl-9 pr-4 text-base font-semibold text-[#3F3766] placeholder:text-[#3F3766]/40 focus:border-[#F7ABC5] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#F7ABC5]/40 transition"
                />
              </div>
            </div>

            {/* LIVE DOMAIN PREVIEW BADGE */}
            <div className="md:col-span-7">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#3F3766]/75 mb-2">
                Live Domain Preview yang Anda Dapatkan
              </label>
              <div className="rounded-2xl border border-[#F7ABC5] bg-[#F7ABC5]/20 p-4 transition-all">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#3F3766]">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F7ABC5] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#3F3766]"></span>
                  </span>
                  Subdomain Wildcard Aktif (HTTPS)
                </div>
                <div className="mt-1.5 flex flex-col gap-1">
                  <p className="font-mono text-sm font-bold text-[#3F3766] truncate">
                    🌐 {domainPreview}
                  </p>
                  <p className="font-mono text-xs text-[#3F3766]/70 truncate">
                    📄 {articleUrlPreview}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* LANGKAH 2: PILIHAN TEMPLATE REFLEKSI */}
        <section className="rounded-3xl border border-[#3F3766]/10 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F7ABC5] text-xs font-bold text-[#3F3766]">
              2
            </span>
            <h2 className="text-lg font-bold text-[#3F3766]">
              Pilih Template Tulisan Siap Pakai
            </h2>
          </div>
          <p className="text-xs text-[#3F3766]/60 mb-6 ml-8">
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
                      ? "border-[#3F3766] bg-[#F7ABC5]/30 ring-2 ring-[#F7ABC5] shadow-sm"
                      : "border-[#3F3766]/10 bg-white hover:border-[#F7ABC5] hover:bg-[#F5E7C6]/50"
                  }`}
                >
                  <div className="text-2xl mb-2">{tmpl.icon}</div>
                  <h3 className="text-sm font-bold text-[#3F3766] leading-snug">
                    {tmpl.name}
                  </h3>
                  <p className="mt-1.5 text-xs text-[#3F3766]/60 line-clamp-2 leading-relaxed">
                    {tmpl.tagline}
                  </p>
                  <div className="mt-auto pt-3">
                    <span
                      className={`inline-block text-[11px] font-bold ${
                        isSelected ? "text-[#3F3766]" : "text-[#3F3766]/40"
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
        <section className="rounded-3xl border border-[#3F3766]/10 bg-white p-6 shadow-sm sm:p-8 space-y-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F7ABC5] text-xs font-bold text-[#3F3766]">
              3
            </span>
            <h2 className="text-lg font-bold text-[#3F3766]">
              Sesuaikan Judul & Isi Tulisan
            </h2>
          </div>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
              ⚠️ {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-[#3F3766] mb-2">
              Judul Refleksi <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Tuliskan judul refleksi yang bermakna..."
              required
              className="w-full rounded-2xl border border-[#3F3766]/15 px-4 py-3.5 text-[#3F3766] placeholder:text-[#3F3766]/40 focus:border-[#F7ABC5] focus:outline-none focus:ring-4 focus:ring-[#F7ABC5]/40 font-semibold text-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-[#3F3766] mb-2">
              Ringkasan Singkat (Excerpt)
            </label>
            <input
              type="text"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Ringkasan atau satu kalimat pengantar..."
              className="w-full rounded-2xl border border-[#3F3766]/15 px-4 py-3 text-[#3F3766] placeholder:text-[#3F3766]/40 focus:border-[#F7ABC5] focus:outline-none focus:ring-4 focus:ring-[#F7ABC5]/40 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-[#3F3766] mb-2">
              Isi Refleksi / Jurnal <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={11}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Ceritakan wawasan atau perjalanan kesehatan mental Anda di sini..."
              required
              className="w-full rounded-2xl border border-[#3F3766]/15 p-4 text-[#3F3766] placeholder:text-[#3F3766]/40 focus:border-[#F7ABC5] focus:outline-none focus:ring-4 focus:ring-[#F7ABC5]/40 leading-relaxed text-base font-sans"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-[#3F3766] mb-2">
              Topik / Tags (Pisahkan dengan koma)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Burnout, Self-Care, Mindfulness"
              className="w-full rounded-2xl border border-[#3F3766]/15 px-4 py-2.5 text-[#3F3766] placeholder:text-[#3F3766]/40 focus:border-[#F7ABC5] focus:outline-none focus:ring-4 focus:ring-[#F7ABC5]/40 text-sm"
            />
          </div>

          {/* LITERA WEB3 SWITCH (PERSIS BIKINWEB PANDI SPEC) */}
          <div className="rounded-3xl border border-[#F7ABC5] bg-gradient-to-br from-white to-[#F7ABC5]/25 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-base font-bold text-[#3F3766] flex items-center gap-2">
                  <span>💎</span> Integrasi Litera Web3 NFT Publishing
                </span>
                <p className="mt-1 text-xs text-[#3F3766]/75 leading-relaxed max-w-xl">
                  {registerLitera
                    ? "Artikel akan didaftarkan ke smart contract Litera di Polygon. Pembaca dapat mengoleksi sertifikat digital kepemilikan."
                    : "Mode tulisan biasa tanpa NFT Web3."}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={registerLitera}
                  onChange={(e) => handleToggleLitera(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-12 h-6 bg-[#3F3766]/15 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#3F3766]/20 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#F7ABC5]"></div>
              </label>
            </div>

            {/* STATUS AKUN DOMPET KREATOR (PRIVY / METAMASK) */}
            {registerLitera && (
              <div className="pt-3 border-t border-[#F7ABC5]/70 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#3F3766]">Akun / Dompet Penulis</label>
                  <button
                    type="button"
                    onClick={() => setIsLoginModalOpen(true)}
                    className="text-xs text-[#3F3766] hover:text-[#F7ABC5] font-bold"
                  >
                    {creatorWallet ? "Ganti Akun" : "Hubungkan Akun"}
                  </button>
                </div>

                {creatorWallet ? (
                  <div className="p-3.5 bg-white rounded-2xl border border-[#F7ABC5] flex items-start gap-3 shadow-sm">
                    <div className="w-8 h-8 rounded-xl bg-[#F7ABC5]/40 text-[#3F3766] flex items-center justify-center shrink-0 font-bold">
                      ✓
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-[#3F3766] truncate">
                          {loginMethod || "Litera Cloud Wallet"}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#3F3766]/60 font-mono truncate mt-0.5">
                        {creatorWallet}
                      </p>
                      <p className="text-[10px] text-[#3F3766] font-medium mt-1">
                        ✓ Siap menerima sertifikat digital on-chain & royalti di Polygon
                      </p>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsLoginModalOpen(true)}
                    className="w-full py-3 px-4 rounded-2xl border-2 border-dashed border-[#3F3766] bg-white hover:bg-[#F7ABC5]/20 text-xs font-bold text-[#3F3766] flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <span>🔐</span> Masuk Akun Litera Cloud (Google / Email)
                  </button>
                )}

                {/* KOLEKSI NFT */}
                <div className="pt-2">
                  <label className="block text-xs font-bold text-[#3F3766] mb-1.5">
                    Koleksi Litera
                  </label>
                  <select
                    value={selectedCollection}
                    onChange={(e) => setSelectedCollection(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-[#3F3766]/15 bg-white text-[#3F3766] focus:outline-none focus:ring-2 focus:ring-[#F7ABC5]"
                  >
                    <option value="">Let Me Hear You - Jurnal & Refleksi (Default)</option>
                    <option value="Ruang Pemulihan & Self-Care">Ruang Pemulihan & Self-Care</option>
                    <option value="Jurnal Mindfulness Harian">Jurnal Mindfulness Harian</option>
                    <option value="__new__">➕ + Buat Koleksi Baru...</option>
                  </select>

                  {selectedCollection === "__new__" && (
                    <div className="mt-2.5 p-3 rounded-2xl bg-white border border-[#F7ABC5] space-y-2">
                      <label className="block text-[11px] font-bold text-[#3F3766]">
                        Nama Koleksi Baru
                      </label>
                      <input
                        type="text"
                        value={newCollectionName}
                        onChange={(e) => setNewCollectionName(e.target.value)}
                        placeholder="Misal: Jurnal Jiwa Tenang"
                        required
                        className="w-full text-xs px-3 py-2 rounded-xl border border-[#3F3766]/15 focus:outline-none focus:ring-2 focus:ring-[#F7ABC5]"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* SUBMIT BUTTON */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#3F3766]/10">
            <div className="text-xs text-[#3F3766]/60">
              Artikel akan terbit langsung di: <strong className="text-[#3F3766]">{domainPreview}</strong>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-[#F7ABC5] px-8 py-3.5 text-base font-bold text-[#3F3766] shadow-md transition hover:bg-[#3F3766] hover:text-[#F5E7C6] disabled:opacity-50"
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

      {/* MODAL AUTH LITERA RESMI */}
      <LiteraLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={handleLoginSuccess}
      />
    </div>
  );
}
