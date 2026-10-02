"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { REFLECTION_TEMPLATES, ReflectionTemplate } from "@/lib/builder-templates";
import { publishTenantArticle } from "@/app/actions/tenant";
import { LiteraLoginModal } from "@/components/litera/LiteraLoginModal";

const STORAGE_KEY = "lmhy_builder_draft_v2";

export function WebBuilderClient({ initialUsername }: { initialUsername?: string }) {
  // 1. Subdomain State & Lock Management
  const [username, setUsername] = useState(initialUsername || "");
  const [tempUsername, setTempUsername] = useState(initialUsername || "");
  const [isSubdomainConfirmed, setIsSubdomainConfirmed] = useState(Boolean(initialUsername && initialUsername.trim()));
  const [subdomainModalError, setSubdomainModalError] = useState<string | null>(null);
  const [isEditingUsernameInStudio, setIsEditingUsernameInStudio] = useState(false);
  const [isPublished, setIsPublished] = useState(false);

  // 2. Template & Article Content State
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("burnout-recovery");
  const [title, setTitle] = useState(REFLECTION_TEMPLATES[0].defaultTitle);
  const [excerpt, setExcerpt] = useState(REFLECTION_TEMPLATES[0].defaultExcerpt);
  const [content, setContent] = useState(REFLECTION_TEMPLATES[0].content);
  const [tags, setTags] = useState(REFLECTION_TEMPLATES[0].defaultTags);

  // 3. Preview Device
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");

  // 4. Litera Web3 State (Unified & Hardened)
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

  // 5. System & UI State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const isHydratedRef = useRef(false);

  const [activeBaseDomain] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return window.location.hostname.includes("letmehearyou.my.id")
        ? "letmehearyou.my.id"
        : "letmehearyou.id";
    }
    return "letmehearyou.id";
  });

  // Format username helper
  const formatUsername = (val: string) => {
    return val
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "")
      .slice(0, 32);
  };

  // 6. Local Storage Persistence (Restore on Mount)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const timer = setTimeout(() => {
      try {
        const rawDraft = localStorage.getItem(STORAGE_KEY);
        if (rawDraft) {
          const d = JSON.parse(rawDraft);
          if (d.username && !initialUsername) {
            setUsername(d.username);
            setTempUsername(d.username);
            setIsSubdomainConfirmed(true);
          }
          if (d.title !== undefined) setTitle(d.title);
          if (d.excerpt !== undefined) setExcerpt(d.excerpt);
          if (d.content !== undefined) setContent(d.content);
          if (d.tags !== undefined) setTags(d.tags);
          if (d.selectedTemplateId !== undefined) setSelectedTemplateId(d.selectedTemplateId);
          if (d.registerLitera !== undefined) setRegisterLitera(d.registerLitera);
          if (d.creatorWallet) setCreatorWallet(d.creatorWallet);
          if (d.loginMethod) setLoginMethod(d.loginMethod);
          if (d.selectedCollection !== undefined) setSelectedCollection(d.selectedCollection);
          if (d.newCollectionName !== undefined) setNewCollectionName(d.newCollectionName);
          if (d.unlockableUrl !== undefined) setUnlockableUrl(d.unlockableUrl);
          if (d.enableQuiz !== undefined) setEnableQuiz(d.enableQuiz);
          if (d.quizQuestion !== undefined) setQuizQuestion(d.quizQuestion);
          if (d.quizOptions !== undefined) setQuizOptions(d.quizOptions);
          if (d.correctIndex !== undefined) setCorrectIndex(d.correctIndex);
          if (d.savedAt) setLastSavedTime(d.savedAt);
        }
      } catch (e) {
        console.warn("Gagal memulihkan draf lokal:", e);
      } finally {
        isHydratedRef.current = true;
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [initialUsername]);

  // 7. Auto-save to Local Storage on Change
  useEffect(() => {
    if (!isHydratedRef.current || typeof window === "undefined") return;
    if (isPublished) return; // Do not overwrite if already published

    const timeStr = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    const draft = {
      username,
      title,
      excerpt,
      content,
      tags,
      selectedTemplateId,
      registerLitera,
      creatorWallet,
      loginMethod,
      selectedCollection,
      newCollectionName,
      unlockableUrl,
      enableQuiz,
      quizQuestion,
      quizOptions,
      correctIndex,
      savedAt: timeStr,
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch (e) {
      console.warn("Gagal menyimpan draf otomatis:", e);
    }
  }, [
    username,
    title,
    excerpt,
    content,
    tags,
    selectedTemplateId,
    registerLitera,
    creatorWallet,
    loginMethod,
    selectedCollection,
    newCollectionName,
    unlockableUrl,
    enableQuiz,
    quizQuestion,
    quizOptions,
    correctIndex,
    isPublished,
  ]);

  // Handle Subdomain Confirmation from Initial Modal
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

  // Handle Inline Studio Username Update
  const handleSaveInlineUsername = () => {
    if (isPublished) return;
    const clean = formatUsername(tempUsername);
    if (!clean || clean.length < 3) {
      setError("Username subdomain minimal 3 karakter.");
      return;
    }
    setUsername(clean);
    setIsEditingUsernameInStudio(false);
    setError(null);
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
      // Auto open login prompt modal
      setIsLoginModalOpen(true);
    }
  };

  const handleLoginSuccess = (walletAddress: string, method: string) => {
    setCreatorWallet(walletAddress);
    setLoginMethod(method);
    setRegisterLitera(true);
    setError(null);
  };

  const cleanUser = username.trim() || "nama-domain";
  const domainPreview = `https://${cleanUser}.${activeBaseDomain}`;

  // Handle Form Submission with Strict Security Hardening
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

    // Security Hardening: If Litera Web3 is ON, Creator Wallet is STRICTLY REQUIRED
    if (registerLitera && !creatorWallet) {
      setError("Peringatan Keamanan: Penerbitan Web3 diaktifkan, namun akun Litera belum terhubung. Hubungkan akun Litera terlebih dahulu agar sertifikat NFT terbit atas nama dompet Anda, atau matikan penerbitan Web3.");
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
        quiz: quizPayload,
      });

      if (!res.success) {
        setError(res.error || "Gagal menerbitkan artikel.");
        setIsSubmitting(false);
        return;
      }

      // Lock username upon successful publishing
      setIsPublished(true);

      // Clean local draft storage
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {
          // ignore
        }
      }

      // Redirect to newly published blog page
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
                Tentukan nama unik untuk alamat publikasi Anda. Anda masih dapat mengubahnya di studio sebelum artikel diterbitkan.
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
                {lastSavedTime && (
                  <span className="hidden sm:inline-flex items-center text-[10px] font-medium text-[#3F3766]/60">
                    • Draf tersimpan {lastSavedTime}
                  </span>
                )}
              </div>

              {/* Subdomain in Header with Edit / Lock indicator */}
              <div className="flex items-center gap-2 mt-0.5">
                {isEditingUsernameInStudio && !isPublished ? (
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs text-[#3F3766]/60">https://</span>
                    <input
                      type="text"
                      value={tempUsername}
                      onChange={(e) => setTempUsername(formatUsername(e.target.value))}
                      className="rounded-lg border border-[#3F3766] bg-white px-2 py-0.5 font-mono text-xs font-bold text-[#3F3766] w-28 focus:outline-none"
                      autoFocus
                    />
                    <span className="font-mono text-xs text-[#3F3766]/60">.{activeBaseDomain}</span>
                    <button
                      type="button"
                      onClick={handleSaveInlineUsername}
                      className="rounded bg-[#3F3766] px-2 py-0.5 text-[10px] font-black text-white"
                    >
                      Simpan
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingUsernameInStudio(false)}
                      className="text-[10px] text-[#3F3766]/60 underline"
                    >
                      Batal
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold text-[#3F3766] truncate max-w-[200px] sm:max-w-xs block">
                      {domainPreview}
                    </span>
                    {!isPublished ? (
                      <button
                        type="button"
                        onClick={() => {
                          setTempUsername(username);
                          setIsEditingUsernameInStudio(true);
                        }}
                        className="text-[10px] font-bold text-[#3F3766]/70 underline hover:text-[#3F3766]"
                      >
                        Ubah
                      </button>
                    ) : (
                      <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                        Terkunci
                      </span>
                    )}
                  </div>
                )}
              </div>
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

      {/* 2. SPLIT WORKSPACE: UNIFIED LEFT CONTROL DECK + RIGHT LIVE MOCKUP */}
      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* PANEL KIRI: UNIFIED STREAMLINED CONTROL DECK (COL-SPAN-5) */}
          <div className="lg:col-span-5 space-y-6">

            {/* ERROR BANNER */}
            {error && (
              <div className="rounded-2xl border-2 border-red-500 bg-red-50 p-4 text-xs font-bold text-red-800 shadow-sm leading-relaxed">
                {error}
              </div>
            )}

            {/* SECTION 1: PRESET TEMPLATE SELECTION */}
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

            {/* SECTION 2: ARTICLE CONTENT FORM */}
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
                  rows={9}
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

            {/* SECTION 3: UNIFIED LITERA WEB3 INTEGRATION CARD (NO SEPARATE TAB) */}
            <div className="rounded-3xl bg-white p-6 border-2 border-[#3F3766]/15 shadow-[0_6px_0_0_#3F3766]/10 space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-[#3F3766] block">
                    Penerbitan Sertifikat Web3 (Litera Protocol)
                  </span>
                  <p className="text-[11px] text-[#3F3766]/70 leading-relaxed mt-1">
                    Aktifkan untuk menerbitkan artikel ini ke jaringan blockchain Polygon sebagai sertifikat digital permanen.
                  </p>
                </div>

                {/* 3D TOGGLE SWITCH */}
                <button
                  type="button"
                  onClick={() => handleToggleLitera(!registerLitera)}
                  className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-[#3F3766] transition-colors duration-200 ease-in-out focus:outline-none ${
                    registerLitera ? "bg-[#F7ABC5]" : "bg-[#3F3766]/20"
                  }`}
                  title={registerLitera ? "Penerbitan Web3 Aktif" : "Penerbitan Web3 Dinonaktifkan"}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white border border-[#3F3766] shadow-[0_2px_4px_rgba(0,0,0,0.2)] transition duration-200 ease-in-out mt-[2px] ml-[2px] ${
                      registerLitera ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {registerLitera ? (
                <div className="space-y-4 pt-3 border-t border-[#3F3766]/10">
                  
                  {/* SECURITY HARDENING BANNER: PROMINENT WARNING IF WALLET NOT CONNECTED */}
                  {!creatorWallet ? (
                    <div className="rounded-2xl border-2 border-amber-500 bg-amber-50 p-4 space-y-2.5">
                      <div className="flex items-center gap-2">
                        <span className="h-5 w-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-black">
                          !
                        </span>
                        <h4 className="text-xs font-black text-amber-900 uppercase tracking-wide">
                          Peringatan Autentikasi Penulis
                        </h4>
                      </div>
                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        Penerbitan Web3 diaktifkan, namun akun Litera Anda belum terhubung. Anda wajib menghubungkan akun Litera Cloud agar hak royalti dan sertifikat NFT terdaftar atas nama Anda.
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsLoginModalOpen(true)}
                        className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black tracking-wide shadow transition"
                      >
                        Hubungkan Akun Litera Cloud Sekarang
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-[#3F3766]">
                          Akun Dompet Penulis Terverifikasi
                        </label>
                        <button
                          type="button"
                          onClick={() => setIsLoginModalOpen(true)}
                          className="text-xs font-black text-[#3F3766] underline hover:text-[#3F3766]/70"
                        >
                          Ganti Akun
                        </button>
                      </div>

                      <div className="p-3 bg-[#F7ABC5]/20 rounded-2xl border-2 border-[#3F3766]/20 flex items-center gap-3">
                        <span className="h-7 w-7 rounded-xl bg-[#3F3766] text-white flex items-center justify-center text-xs font-black">
                          OK
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-[#3F3766] truncate">{loginMethod || "Litera Cloud Wallet"}</p>
                          <p className="text-[10px] font-mono text-[#3F3766]/80 truncate">{creatorWallet}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SMART DYNAMIC COLLECTION */}
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
                          placeholder="Misal: Catatan Pemulihan Pribadi"
                          className="w-full text-xs px-3 py-2 rounded-xl border-2 border-[#3F3766]/20 focus:outline-none focus:border-[#3F3766]"
                        />
                      </div>
                    )}
                  </div>

                  {/* UNLOCKABLE CONTENT LINK */}
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

                  {/* PROOF OF READING QUIZ */}
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

                  {/* TOKENOMICS POLICY BADGE (MANAGED BY ADMIN, READ-ONLY FOR USERS) */}
                  <div className="pt-2 border-t border-[#3F3766]/10">
                    <div className="rounded-2xl bg-[#F5E7C6]/50 p-3.5 border-2 border-[#3F3766]/15 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase tracking-wider text-[#3F3766]">
                          Kebijakan Tokenomics Platform
                        </span>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-[#3F3766] bg-[#F7ABC5] px-2 py-0.5 rounded-full border border-[#3F3766]/20">
                          Dikelola Admin
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs font-mono font-bold text-[#3F3766] pt-1">
                        <span>Biaya Cetak: 0 LITE (Gratis Pembaca)</span>
                        <span>Suplai: 100 Edisi Koleksi</span>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <p className="text-[10px] text-[#3F3766]/70 leading-relaxed">
                          Parameter ekonomi digital dikunci oleh Admin Platform agar seluruh konten refleksi tetap dapat diakses publik secara gratis.
                        </p>
                        <Link
                          href="/admin/litera"
                          className="shrink-0 text-[10px] font-black text-[#3F3766] underline hover:text-[#3F3766]/70 ml-2"
                        >
                          Kelola di Portal Admin →
                        </Link>
                      </div>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="rounded-2xl border-2 border-dashed border-[#3F3766]/20 bg-[#F5E7C6]/20 p-4 text-center">
                  <p className="text-xs font-bold text-[#3F3766]/70">
                    Penerbitan Web3 Dinonaktifkan
                  </p>
                  <p className="text-[11px] text-[#3F3766]/50 mt-1">
                    Artikel akan diterbitkan sebagai blog standar tanpa sertifikat NFT.
                  </p>
                </div>
              )}
            </div>

          </div>

          {/* PANEL KANAN: LIVE MOCKUP CANVAS WITH EXACT IMAGE 2 WIREFRAME (COL-SPAN-7) */}
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
                  <div className="p-6 sm:p-8 min-h-[460px] max-h-[640px] overflow-y-auto space-y-6 bg-gradient-to-b from-[#F5E7C6]/20 via-white to-white">
                    
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

                    {/* EXACT WIREFRAME REPLICATION OF IMAGE 2: LITERA OFFICIAL NFT EMBED CARD */}
                    {registerLitera ? (
                      <div className="mt-8 rounded-3xl bg-[#171d2a] p-6 sm:p-8 text-center border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col items-center relative overflow-hidden">
                        
                        {/* Subtle Background Radial Glow */}
                        <div className="absolute -top-12 -left-12 w-48 h-48 bg-[#d97746]/20 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-[#3F3766]/40 rounded-full blur-3xl pointer-events-none" />

                        {/* Centered Artwork Box with Warm Hue & 'Let Me Hear You' Glass Badge */}
                        <div className="relative w-44 h-44 sm:w-52 sm:h-52 rounded-2xl overflow-hidden border border-white/15 shadow-2xl bg-[#c5baa7] flex items-center justify-center group">
                          {/* Inner Illustration / Avatar */}
                          <div className="relative w-full h-full flex items-center justify-center p-2">
                            <Image
                              src="/assets/sapiens.png"
                              alt="Artwork Cover"
                              width={190}
                              height={190}
                              className="object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.3)] opacity-95 transition-transform duration-300 group-hover:scale-105"
                            />
                          </div>

                          {/* Floating Top-Left Glass Badge: ● Let Me Hear You */}
                          <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-md px-2.5 py-1 border border-white/20 shadow-sm">
                            <span className="h-2 w-2 rounded-full bg-[#f27438] animate-pulse"></span>
                            <span className="text-[10px] font-bold !text-white tracking-wide">
                              Let Me Hear You
                            </span>
                          </div>
                        </div>

                        {/* Author / Community Pill: ● THE EVERYDAY HUMAN / Collection */}
                        <div className="mt-5 mb-2.5 inline-flex items-center gap-1.5 rounded-full bg-[#351918] border border-[#d97746]/40 px-3.5 py-1 text-[10px] font-black !text-[#f08554] uppercase tracking-wider shadow-sm">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#f08554]"></span>
                          <span>
                            {selectedCollection && selectedCollection !== "__new__"
                              ? selectedCollection
                              : newCollectionName || "THE EVERYDAY HUMAN"}
                          </span>
                        </div>

                        {/* Article Title */}
                        <h3 className="text-base sm:text-lg font-black !text-white leading-snug tracking-tight max-w-sm mt-1">
                          {title || "Mengenali Tanda Burnout Sebelum Terlambat"}
                        </h3>

                        {/* Subtitle */}
                        <p className="text-xs !text-slate-300 mt-2 max-w-xs leading-relaxed">
                          Diterbitkan resmi sebagai aset digital permanen artikel ini.
                        </p>

                        {/* Action CTA Button: Miliki Edisi Digital */}
                        <button
                          type="button"
                          className="w-full max-w-xs mt-6 py-3 px-6 rounded-2xl bg-gradient-to-r from-[#cf6e3e] to-[#b8582d] !text-white text-xs font-black tracking-wide shadow-[0_6px_20px_rgba(207,110,62,0.45)] hover:brightness-110 active:scale-[0.98] transition-all border border-[#f08554]/30"
                        >
                          Miliki Edisi Digital
                        </button>

                        {/* Footer: Ⓛ v1.4.66 • Powered by Litera */}
                        <div className="mt-5 flex items-center justify-center gap-1.5 text-[10px] !text-slate-400 font-medium">
                          <span className="h-3.5 w-3.5 rounded-full bg-[#cf6e3e] !text-white flex items-center justify-center text-[7px] font-black italic">
                            L
                          </span>
                          <span>v1.4.66 • Powered by Litera</span>
                        </div>

                      </div>
                    ) : (
                      <div className="mt-8 rounded-2xl border-2 border-dashed border-[#3F3766]/20 bg-[#F5E7C6]/20 p-4 text-center text-xs text-[#3F3766]/60">
                        Penerbitan Web3 Dinonaktifkan (Artikel diterbitkan sebagai blog standar)
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
