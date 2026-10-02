"use client";

import { useState } from "react";
import Link from "next/link";
import { REFLECTION_TEMPLATES, ReflectionTemplate } from "@/lib/builder-templates";
import { publishTenantArticle } from "@/app/actions/tenant";
import { LiteraLoginModal } from "@/components/litera/LiteraLoginModal";

export function WebBuilderClient({ initialUsername }: { initialUsername?: string }) {
  // Onboarding Subdomain Gate
  const [username, setUsername] = useState(initialUsername || "");
  const [tempUsername, setTempUsername] = useState(initialUsername || "");
  const [isSubdomainConfirmed, setIsSubdomainConfirmed] = useState(Boolean(initialUsername && initialUsername.trim()));
  const [subdomainModalError, setSubdomainModalError] = useState<string | null>(null);

  // Template & Content State
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("burnout-recovery");
  const [title, setTitle] = useState(REFLECTION_TEMPLATES[0].defaultTitle);
  const [excerpt, setExcerpt] = useState(REFLECTION_TEMPLATES[0].defaultExcerpt);
  const [content, setContent] = useState(REFLECTION_TEMPLATES[0].content);
  const [tags, setTags] = useState(REFLECTION_TEMPLATES[0].defaultTags);
  
  // Preview & Tab State
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [activeTab, setActiveTab] = useState<"editor" | "litera">("editor");

  // Litera Web3 State (BikinWeb Blueprint)
  const [registerLitera, setRegisterLitera] = useState(true);
  const [creatorWallet, setCreatorWallet] = useState<string>("");
  const [loginMethod, setLoginMethod] = useState<string>("");
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<string>("");
  const [newCollectionName, setNewCollectionName] = useState<string>("");
  const [unlockableUrl, setUnlockableUrl] = useState<string>("");

  // Quiz State (Proof of Reading)
  const [enableQuiz, setEnableQuiz] = useState<boolean>(false);
  const [quizQuestion, setQuizQuestion] = useState<string>("");
  const [quizOptions, setQuizOptions] = useState<string[]>(["", "", ""]);
  const [correctIndex, setCorrectIndex] = useState<number>(0);

  // Tokenomics Customization (Platform Default: 0 LITE, 100 supply)
  const [showAdvancedTokenomics, setShowAdvancedTokenomics] = useState<boolean>(false);
  const [maxMint, setMaxMint] = useState<number>(100);
  const [priceLite, setPriceLite] = useState<number>(0);

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

  // Handle Username Formatting
  const formatUsername = (val: string) => {
    return val
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "")
      .slice(0, 32);
  };

  const handleConfirmSubdomain = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = formatUsername(tempUsername);
    if (!clean || clean.length < 3) {
      setSubdomainModalError("Username subdomain minimal 3 karakter (huruf, angka, atau tanda minus).");
      return;
    }
    setUsername(clean);
    setIsSubdomainConfirmed(true);
    setSubdomainModalError(null);
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

  const cleanUser = username.trim() || "nama-domain";
  const domainPreview = `https://${cleanUser}.${activeBaseDomain}`;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!username.trim()) {
      setIsSubdomainConfirmed(false);
      return;
    }
    if (!title.trim() || !content.trim()) {
      setError("Judul dan isi tulisan wajib diisi.");
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

      const quizPayload =
        enableQuiz && quizQuestion.trim()
          ? {
              question: quizQuestion.trim(),
              options: quizOptions.map((o) => o.trim()).filter(Boolean),
              correctIndex,
            }
          : undefined;

      const res = await publishTenantArticle({
        username: cleanUser,
        title,
        excerpt,
        content,
        tags,
        registerLitera,
        creatorAddress: creatorWallet || undefined,
        collectionName: finalCollection,
        unlockableUrl: unlockableUrl.trim() || undefined,
        maxMint: Number(maxMint) || 100,
        priceLite: Number(priceLite) || 0,
        quiz: quizPayload,
      });

      if (!res.success) {
        setError(res.error || "Gagal menerbitkan artikel.");
        setIsSubmitting(false);
        return;
      }

      // Arahkan ke URL subdomain live pengguna
      const targetUrl = `https://${cleanUser}.${activeBaseDomain}/${res.slug}`;
      window.location.href = targetUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat mempublikasikan.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen relative">
      {/* 0. MANDATORY SUBDOMAIN IDENTITY MODAL (HARD GATE) */}
      {!isSubdomainConfirmed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3F3766]/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border-4 border-[#3F3766] bg-[#F5E7C6] p-6 sm:p-8 shadow-[0_20px_60px_rgba(63,55,102,0.4)]">
            <div className="mb-6 text-center">
              <span className="inline-block rounded-xl bg-[#3F3766] px-3 py-1 text-[11px] font-black uppercase tracking-wider text-[#F7ABC5] mb-3">
                Identitas Penerbit
              </span>
              <h2 className="text-xl font-black text-[#3F3766] tracking-tight">
                Tentukan Subdomain Blog
              </h2>
              <p className="mt-1.5 text-xs text-[#3F3766]/75 leading-relaxed">
                Tentukan nama unik untuk alamat permanen publikasi Anda sebelum memulai penulisan.
              </p>
            </div>

            <form onSubmit={handleConfirmSubdomain} className="space-y-5">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[#3F3766] mb-2">
                  Username Subdomain
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 font-mono font-bold text-sm text-[#3F3766]/50">
                    @
                  </span>
                  <input
                    type="text"
                    value={tempUsername}
                    onChange={(e) => setTempUsername(formatUsername(e.target.value))}
                    placeholder="contoh: ratna, budi, maya"
                    autoFocus
                    required
                    className="w-full rounded-2xl border-2 border-[#3F3766] bg-white py-3.5 pl-9 pr-4 text-base font-mono font-bold text-[#3F3766] placeholder:text-[#3F3766]/30 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#F7ABC5] transition shadow-inner"
                  />
                </div>
                {subdomainModalError && (
                  <p className="mt-2 text-xs font-bold text-red-600">
                    {subdomainModalError}
                  </p>
                )}
              </div>

              {/* LIVE DOMAIN BADGE PREVIEW */}
              <div className="rounded-2xl border-2 border-[#3F3766]/20 bg-white/70 p-3.5 shadow-sm">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#3F3766]/60 block mb-1">
                  Alamat Blog Resmi
                </span>
                <p className="font-mono text-xs font-bold text-[#3F3766] break-all">
                  https://{formatUsername(tempUsername) || "username"}.{activeBaseDomain}
                </p>
              </div>

              <button
                type="submit"
                className="w-full rounded-2xl bg-[#F7ABC5] py-3.5 text-sm font-black uppercase tracking-wider text-[#3F3766] border-2 border-[#3F3766] shadow-[0_4px_0_0_#3F3766] hover:shadow-[0_2px_0_0_#3F3766] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px] transition-all"
              >
                Konfirmasi
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 1. TOP STUDIO NAVIGATION BAR */}
      <header className="sticky top-0 z-30 border-b border-[#3F3766]/15 bg-[#F5E7C6]/90 backdrop-blur-md px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border-2 border-[#3F3766]/20 shadow-sm transition hover:border-[#3F3766]"
              title="Kembali ke Beranda"
            >
              <span className="text-xs font-black text-[#3F3766]">←</span>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-wider uppercase text-[#3F3766]">
                  Studio Canvas
                </span>
                <span className="inline-flex items-center rounded-full bg-[#F7ABC5]/40 px-2 py-0.5 text-[10px] font-bold text-[#3F3766] border border-[#3F3766]/20">
                  Live
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setTempUsername(username);
                  setIsSubdomainConfirmed(false);
                }}
                className="text-[11px] font-mono font-bold text-[#3F3766] underline hover:text-[#3F3766]/70 truncate max-w-[200px] sm:max-w-xs block text-left"
              >
                {domainPreview}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center rounded-xl bg-white/70 p-1 border-2 border-[#3F3766]/15 shadow-inner">
              <button
                type="button"
                onClick={() => setPreviewDevice("desktop")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  previewDevice === "desktop"
                    ? "bg-[#3F3766] text-white shadow-sm"
                    : "text-[#3F3766]/70 hover:text-[#3F3766]"
                }`}
              >
                Desktop
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice("mobile")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  previewDevice === "mobile"
                    ? "bg-[#3F3766] text-white shadow-sm"
                    : "text-[#3F3766]/70 hover:text-[#3F3766]"
                }`}
              >
                Mobile
              </button>
            </div>

            <button
              onClick={() => handleSubmit()}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-xl bg-[#F7ABC5] px-6 py-2.5 text-xs font-black tracking-wide text-[#3F3766] uppercase shadow-[0_4px_0_0_#3F3766] hover:shadow-[0_2px_0_0_#3F3766] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px] transition-all border-2 border-[#3F3766] disabled:opacity-50"
            >
              {isSubmitting ? "Menerbitkan..." : "Terbitkan Blog"}
            </button>
          </div>
        </div>
      </header>

      {/* 2. SPLIT WORKSPACE: LEFT CONTROL DECK + RIGHT LIVE MOCKUP */}
      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* PANEL KIRI: CONTROL DOCK (COL-SPAN-5) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* TABS HEADER */}
            <div className="flex rounded-2xl bg-white/80 p-1.5 border-2 border-[#3F3766]/15 shadow-sm">
              <button
                type="button"
                onClick={() => setActiveTab("editor")}
                className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${
                  activeTab === "editor"
                    ? "bg-[#3F3766] text-[#F5E7C6] shadow-md shadow-[#3F3766]/20"
                    : "text-[#3F3766]/70 hover:text-[#3F3766]"
                }`}
              >
                Konten & Refleksi
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("litera")}
                className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${
                  activeTab === "litera"
                    ? "bg-[#3F3766] text-[#F5E7C6] shadow-md shadow-[#3F3766]/20"
                    : "text-[#3F3766]/70 hover:text-[#3F3766]"
                }`}
              >
                Koleksi Digital Litera
              </button>
            </div>

            {error && (
              <div className="rounded-2xl border-2 border-red-500 bg-red-50 p-4 text-xs font-bold text-red-800 shadow-sm">
                {error}
              </div>
            )}

            {activeTab === "editor" ? (
              <div className="space-y-6">
                {/* PRESET TEMPLATE SELECTION */}
                <div className="rounded-3xl bg-white p-5 border-2 border-[#3F3766]/15 shadow-[0_6px_0_0_#3F3766]/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-black uppercase tracking-wider text-[#3F3766]">
                      Pilihan Tema Refleksi
                    </label>
                    <span className="text-[10px] font-bold text-[#F7ABC5] bg-[#3F3766] px-2 py-0.5 rounded-full">
                      Preset Siap Pakai
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    {REFLECTION_TEMPLATES.map((tmpl) => {
                      const isSelected = selectedTemplateId === tmpl.id;
                      return (
                        <button
                          key={tmpl.id}
                          type="button"
                          onClick={() => handleSelectTemplate(tmpl)}
                          className={`flex flex-col text-left p-3 rounded-2xl border-2 transition-all relative overflow-hidden ${
                            isSelected
                              ? "border-[#3F3766] bg-[#F7ABC5]/25 shadow-[0_3px_0_0_#3F3766]"
                              : "border-[#3F3766]/15 bg-white hover:border-[#3F3766]/40 hover:bg-[#F5E7C6]/30"
                          }`}
                        >
                          <span className="text-xs font-black text-[#3F3766] truncate w-full">
                            {tmpl.name}
                          </span>
                          <span className="text-[10px] text-[#3F3766]/60 line-clamp-1 mt-0.5">
                            {tmpl.tagline}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* EDITOR FORM INPUTS */}
                <div className="rounded-3xl bg-white p-6 border-2 border-[#3F3766]/15 shadow-[0_6px_0_0_#3F3766]/10 space-y-4">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-[#3F3766] mb-1.5">
                      Judul Tulisan
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Tuliskan judul artikel Anda..."
                      required
                      className="w-full rounded-2xl border-2 border-[#3F3766]/15 bg-white px-4 py-3 text-sm font-bold text-[#3F3766] placeholder:text-[#3F3766]/40 focus:border-[#3F3766] focus:ring-4 focus:ring-[#F7ABC5]/30 focus:outline-none transition shadow-inner"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-[#3F3766] mb-1.5">
                      Ringkasan / Sinopsis (Excerpt)
                    </label>
                    <input
                      type="text"
                      value={excerpt}
                      onChange={(e) => setExcerpt(e.target.value)}
                      placeholder="Satu atau dua kalimat pembuka..."
                      className="w-full rounded-2xl border-2 border-[#3F3766]/15 bg-white px-4 py-2.5 text-xs font-semibold text-[#3F3766] placeholder:text-[#3F3766]/40 focus:border-[#3F3766] focus:ring-4 focus:ring-[#F7ABC5]/30 focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-black uppercase tracking-wider text-[#3F3766]">
                        Isi Tulisan
                      </label>
                      <span className="text-[10px] font-mono font-bold text-[#3F3766]/60">
                        {content.length} karakter
                      </span>
                    </div>
                    <textarea
                      rows={10}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Tuliskan pengalaman atau materi Anda di sini..."
                      required
                      className="w-full rounded-2xl border-2 border-[#3F3766]/15 bg-white p-4 text-xs font-medium text-[#3F3766] placeholder:text-[#3F3766]/40 leading-relaxed focus:border-[#3F3766] focus:ring-4 focus:ring-[#F7ABC5]/30 focus:outline-none transition font-sans resize-y shadow-inner"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-[#3F3766] mb-1.5">
                      Kategori / Tag (Pisahkan koma)
                    </label>
                    <input
                      type="text"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      placeholder="Kesehatan Mental, Pemulihan, Refleksi"
                      className="w-full rounded-2xl border-2 border-[#3F3766]/15 bg-white px-4 py-2 text-xs font-semibold text-[#3F3766] placeholder:text-[#3F3766]/40 focus:border-[#3F3766] focus:ring-4 focus:ring-[#F7ABC5]/30 focus:outline-none transition"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* LITERA WEB3 INTEGRATION CARD (BIKINWEB SPEC) */}
                <div className="rounded-3xl bg-white p-6 border-2 border-[#3F3766]/15 shadow-[0_6px_0_0_#3F3766]/10 space-y-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider text-[#3F3766] block">
                        Penerbitan Sertifikat Web3
                      </span>
                      <p className="text-[11px] text-[#3F3766]/70 leading-relaxed mt-1">
                        Daftarkan karya ini ke smart contract Litera di Polygon sebagai sertifikat digital permanen.
                      </p>
                    </div>

                    {/* 3D TOGGLE SWITCH */}
                    <button
                      type="button"
                      onClick={() => handleToggleLitera(!registerLitera)}
                      className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-[#3F3766] transition-colors duration-200 ease-in-out focus:outline-none ${
                        registerLitera ? "bg-[#F7ABC5]" : "bg-[#3F3766]/20"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white border border-[#3F3766] shadow-[0_2px_4px_rgba(0,0,0,0.2)] transition duration-200 ease-in-out mt-[2px] ml-[2px] ${
                          registerLitera ? "translate-x-6" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {registerLitera && (
                    <div className="space-y-4 pt-2 border-t border-[#3F3766]/10">
                      {/* A. IDENTITAS DOMPET KREATOR */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-bold text-[#3F3766]">
                            Akun Dompet Penulis
                          </label>
                          <button
                            type="button"
                            onClick={() => setIsLoginModalOpen(true)}
                            className="text-xs font-black text-[#3F3766] underline hover:text-[#3F3766]/70"
                          >
                            {creatorWallet ? "Ganti Akun" : "Hubungkan"}
                          </button>
                        </div>

                        {creatorWallet ? (
                          <div className="p-3 bg-[#F7ABC5]/20 rounded-2xl border-2 border-[#3F3766]/20 flex items-center gap-3">
                            <span className="h-7 w-7 rounded-xl bg-[#3F3766] text-white flex items-center justify-center text-xs font-black">
                              OK
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-[#3F3766] truncate">{loginMethod || "Litera Wallet"}</p>
                              <p className="text-[10px] font-mono text-[#3F3766]/80 truncate">{creatorWallet}</p>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setIsLoginModalOpen(true)}
                            className="w-full py-3 px-4 rounded-2xl border-2 border-dashed border-[#3F3766] bg-white hover:bg-[#F7ABC5]/20 text-xs font-black text-[#3F3766] flex items-center justify-center gap-2 transition"
                          >
                            Hubungkan Akun Litera Cloud (Google / Email)
                          </button>
                        )}
                      </div>

                      {/* B. SMART DYNAMIC COLLECTION */}
                      <div>
                        <label className="block text-xs font-bold text-[#3F3766] mb-1.5">
                          Pilihan Koleksi Litera
                        </label>
                        <select
                          value={selectedCollection}
                          onChange={(e) => setSelectedCollection(e.target.value)}
                          className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border-2 border-[#3F3766]/15 bg-white text-[#3F3766] focus:outline-none focus:border-[#3F3766]"
                        >
                          <option value="">Let Me Hear You - Jurnal & Refleksi (Default)</option>
                          <option value="Ruang Pemulihan & Self-Care">Ruang Pemulihan & Self-Care</option>
                          <option value="Jurnal Mindfulness Harian">Jurnal Mindfulness Harian</option>
                          <option value="__new__">+ Buat Koleksi Baru...</option>
                        </select>

                        {selectedCollection === "__new__" && (
                          <div className="mt-2.5 p-3 rounded-2xl bg-[#F5E7C6]/50 border-2 border-[#3F3766]/20 space-y-2">
                            <label className="block text-[11px] font-bold text-[#3F3766]">
                              Nama Koleksi Baru
                            </label>
                            <input
                              type="text"
                              value={newCollectionName}
                              onChange={(e) => setNewCollectionName(e.target.value)}
                              placeholder="Misal: Inovasi Pembelajaran Digital"
                              className="w-full text-xs px-3 py-2 rounded-xl border-2 border-[#3F3766]/20 focus:outline-none focus:border-[#3F3766]"
                            />
                            <p className="text-[10px] text-[#3F3766]/70">
                              Sampul koleksi otomatis menggunakan gambar unggulan artikel pertama.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* C. MATERI EKSKLUSIF (UNLOCKABLE CONTENT) */}
                      <div>
                        <label className="block text-xs font-bold text-[#3F3766] mb-1">
                          Tautan Materi Eksklusif (Opsional)
                        </label>
                        <input
                          type="url"
                          value={unlockableUrl}
                          onChange={(e) => setUnlockableUrl(e.target.value)}
                          placeholder="https://drive.google.com/file/d/..."
                          className="w-full text-xs px-3 py-2 rounded-xl border-2 border-[#3F3766]/15 bg-white text-[#3F3766] placeholder:text-[#3F3766]/40 focus:outline-none focus:border-[#3F3766]"
                        />
                        <p className="text-[10px] text-[#3F3766]/60 mt-1">
                          Hanya dapat diakses pembaca setelah berhasil mengklaim sertifikat NFT.
                        </p>
                      </div>

                      {/* D. KUIS REFLEKSI (PROOF OF READING) */}
                      <div className="pt-2 border-t border-[#3F3766]/10 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-[#3F3766] block">
                              Kuis Refleksi Pembaca (Proof of Reading)
                            </span>
                            <span className="text-[10px] text-[#3F3766]/60">
                              Uji pemahaman pembaca sebelum sertifikat diberikan.
                            </span>
                          </div>
                          <input
                            type="checkbox"
                            checked={enableQuiz}
                            onChange={(e) => setEnableQuiz(e.target.checked)}
                            className="h-4 w-4 rounded border-[#3F3766] text-[#3F3766] focus:ring-[#F7ABC5]"
                          />
                        </div>

                        {enableQuiz && (
                          <div className="p-3.5 rounded-2xl bg-[#F5E7C6]/50 border-2 border-[#3F3766]/20 space-y-2.5">
                            <div>
                              <label className="block text-[11px] font-bold text-[#3F3766] mb-1">
                                Pertanyaan Kuis
                              </label>
                              <input
                                type="text"
                                value={quizQuestion}
                                onChange={(e) => setQuizQuestion(e.target.value)}
                                placeholder="Apa poin utama dari tulisan ini?"
                                className="w-full text-xs px-3 py-2 rounded-xl border-2 border-[#3F3766]/20 bg-white focus:outline-none focus:border-[#3F3766]"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="block text-[11px] font-bold text-[#3F3766]">
                                Pilihan Jawaban (Pilih radio untuk kunci benar)
                              </label>
                              {quizOptions.map((opt, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                  <input
                                    type="radio"
                                    name="correctQuizOption"
                                    checked={correctIndex === idx}
                                    onChange={() => setCorrectIndex(idx)}
                                    className="text-[#3F3766] focus:ring-[#F7ABC5]"
                                  />
                                  <input
                                    type="text"
                                    value={opt}
                                    onChange={(e) => {
                                      const updated = [...quizOptions];
                                      updated[idx] = e.target.value;
                                      setQuizOptions(updated);
                                    }}
                                    placeholder={`Pilihan ${String.fromCharCode(65 + idx)}`}
                                    className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-[#3F3766]/20 bg-white focus:outline-none focus:border-[#3F3766]"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* E. PENGATURAN TOKENOMICS PLATFORM (ACCORDION LANJUTAN) */}
                      <div className="pt-2 border-t border-[#3F3766]/10">
                        <button
                          type="button"
                          onClick={() => setShowAdvancedTokenomics(!showAdvancedTokenomics)}
                          className="w-full flex items-center justify-between text-xs font-bold text-[#3F3766]/80 hover:text-[#3F3766] py-1"
                        >
                          <span>Parameter Tokenomics Platform</span>
                          <span className="font-mono text-xs">{showAdvancedTokenomics ? "▲" : "▼"}</span>
                        </button>

                        {showAdvancedTokenomics ? (
                          <div className="mt-2.5 p-3 rounded-2xl bg-white border-2 border-[#3F3766]/15 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[11px] font-bold text-[#3F3766] mb-1">
                                  Batas Suplai (Max Mint)
                                </label>
                                <input
                                  type="number"
                                  min={2}
                                  value={maxMint}
                                  onChange={(e) => setMaxMint(Number(e.target.value))}
                                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-[#3F3766]/20 focus:outline-none focus:border-[#3F3766]"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-bold text-[#3F3766] mb-1">
                                  Biaya Mint (LITE)
                                </label>
                                <input
                                  type="number"
                                  min={0}
                                  value={priceLite}
                                  onChange={(e) => setPriceLite(Number(e.target.value))}
                                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-[#3F3766]/20 focus:outline-none focus:border-[#3F3766]"
                                />
                              </div>
                            </div>
                            <p className="text-[10px] text-[#3F3766]/60 leading-relaxed">
                              Nilai bawaan platform: 0 LITE (Gratis bagi pembaca) dengan batas cetak 100 edisi koleksi.
                            </p>
                          </div>
                        ) : (
                          <div className="mt-1.5 flex items-center justify-between text-[11px] font-mono font-bold text-[#3F3766]/70 bg-white/60 p-2.5 rounded-xl border border-[#3F3766]/10">
                            <span>Biaya: 0 LITE (Gratis)</span>
                            <span>Suplai: {maxMint} Edisi</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* PANEL KANAN: LIVE MOCKUP CANVAS (COL-SPAN-7) */}
          <div className="lg:col-span-7 sticky top-20">
            <div className="flex flex-col items-center">
              <div
                className={`w-full transition-all duration-300 ${
                  previewDevice === "mobile" ? "max-w-sm" : "max-w-full"
                }`}
              >
                <div className="rounded-[32px] border-4 border-[#3F3766] bg-white shadow-[0_16px_40px_rgba(63,55,102,0.18),0_0_24px_rgba(247,171,197,0.3)] overflow-hidden transition-all">
                  
                  {/* SIMULATED BROWSER TOP BAR */}
                  <div className="bg-[#3F3766] px-4 py-3 flex items-center justify-between gap-3 border-b-2 border-[#3F3766]">
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="h-3 w-3 rounded-full bg-[#FF5F56] border border-black/20"></span>
                      <span className="h-3 w-3 rounded-full bg-[#FFBD2E] border border-black/20"></span>
                      <span className="h-3 w-3 rounded-full bg-[#27C93F] border border-black/20"></span>
                    </div>

                    <div className="flex-1 max-w-sm mx-auto flex items-center justify-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-mono font-medium text-[#F5E7C6] border border-white/15 truncate shadow-inner">
                      <span>https://{cleanUser}.{activeBaseDomain}</span>
                    </div>

                    <div className="w-8 shrink-0 text-right">
                      <span className="text-[10px] font-mono font-bold text-[#F7ABC5]">LIVE</span>
                    </div>
                  </div>

                  {/* SIMULATED TENANT BLOG PAGE CONTENT */}
                  <div className="p-6 sm:p-8 min-h-[460px] max-h-[580px] overflow-y-auto space-y-6 bg-gradient-to-b from-[#F5E7C6]/20 via-white to-white">
                    
                    {/* Simulated Header */}
                    <div className="border-b border-[#3F3766]/10 pb-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-[#F7ABC5] text-[#3F3766] flex items-center justify-center text-xs font-black shadow-sm">
                          {cleanUser.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-black text-[#3F3766]">@{cleanUser}</p>
                          <p className="text-[10px] text-[#3F3766]/60">Ruang Publikasi Pribadi</p>
                        </div>
                      </div>

                      {registerLitera && (
                        <span className="rounded-full bg-[#3F3766] px-2.5 py-0.5 text-[9px] font-bold text-[#F7ABC5] shadow-sm">
                          Web3 Verified
                        </span>
                      )}
                    </div>

                    {/* Article Body */}
                    <article className="space-y-4">
                      <div className="flex flex-wrap gap-1.5">
                        {tags
                          .split(",")
                          .map((t) => t.trim())
                          .filter(Boolean)
                          .map((tag, idx) => (
                            <span
                              key={idx}
                              className="rounded-lg bg-[#F7ABC5]/25 px-2 py-0.5 text-[10px] font-bold text-[#3F3766] border border-[#F7ABC5]/40"
                            >
                              #{tag}
                            </span>
                          ))}
                      </div>

                      <h1 className="text-xl sm:text-2xl font-black text-[#3F3766] leading-snug tracking-tight">
                        {title || "Judul Tulisan Anda"}
                      </h1>

                      {excerpt && (
                        <p className="text-xs sm:text-sm font-semibold italic text-[#3F3766]/70 border-l-2 border-[#F7ABC5] pl-3 py-0.5">
                          &ldquo;{excerpt}&rdquo;
                        </p>
                      )}

                      <div className="text-xs sm:text-sm text-[#3F3766]/85 font-medium leading-relaxed whitespace-pre-wrap font-sans pt-2">
                        {content || "Tuliskan materi atau catatan refleksi Anda pada panel sebelah kiri..."}
                      </div>
                    </article>

                    {/* LIVE LITERA WIDGET EMBED PREVIEW */}
                    {registerLitera && (
                      <div className="mt-8 rounded-2xl border-2 border-[#3F3766] bg-[#F5E7C6]/30 p-4 space-y-3">
                        <div className="flex items-center justify-between border-b border-[#3F3766]/10 pb-2">
                          <span className="text-[11px] font-black uppercase text-[#3F3766]">
                            Sertifikat Literasi Digital (NFT)
                          </span>
                          <span className="text-[10px] font-mono font-bold text-[#3F3766]/70">
                            Polygon Mainnet
                          </span>
                        </div>
                        <div className="text-xs space-y-1">
                          <p className="font-bold text-[#3F3766]">
                            Koleksi: {selectedCollection === "__new__" ? newCollectionName || "Koleksi Baru" : selectedCollection || "Let Me Hear You - Jurnal & Refleksi"}
                          </p>
                          <p className="text-[11px] text-[#3F3766]/70">
                            Biaya: 0 LITE (Gratis) • Suplai: {maxMint} Edisi
                          </p>
                        </div>
                        {unlockableUrl && (
                          <div className="p-2 rounded-xl bg-white border border-[#3F3766]/20 text-[10px] font-bold text-[#3F3766]">
                            Materi Eksklusif Terlampir (Terkunci hingga sertifikat diklaim)
                          </div>
                        )}
                        {enableQuiz && (
                          <div className="p-2 rounded-xl bg-white border border-[#3F3766]/20 text-[10px] font-bold text-[#3F3766]">
                            Kuis Refleksi Aktif (Proof of Reading)
                          </div>
                        )}
                      </div>
                    )}

                    <div className="pt-6 border-t border-[#3F3766]/10 flex items-center justify-between text-[10px] text-[#3F3766]/50">
                      <span>Diterbitkan via Let Me Hear You</span>
                      <span className="font-mono">Hari ini</span>
                    </div>
                  </div>
                </div>

                <div className="mx-auto h-2 w-3/4 rounded-full bg-[#3F3766]/10 blur-sm mt-3"></div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* MODAL AUTH LITERA POPUP */}
      <LiteraLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={handleLoginSuccess}
      />
    </div>
  );
}
