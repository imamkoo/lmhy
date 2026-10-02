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
  
  // Preview Controls
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [activeTab, setActiveTab] = useState<"editor" | "settings">("editor");

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

  const cleanUser = username.trim() || "username-kamu";
  const domainPreview = `https://${cleanUser}.${activeBaseDomain}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError("Silakan tentukan subdomain blog Anda terlebih dahulu.");
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

      // Langsung arahkan ke URL subdomain live pengguna
      const targetUrl = `https://${cleanUser}.${activeBaseDomain}/${res.slug}`;
      window.location.href = targetUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat mempublikasikan.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. TOP STUDIO FLOATING BAR */}
      <header className="sticky top-0 z-30 border-b border-[#3F3766]/15 bg-[#F5E7C6]/85 backdrop-blur-md px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          {/* Logo & Breadcrumb */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="group flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-[#3F3766]/15 shadow-sm transition hover:border-[#F7ABC5] hover:shadow-[0_0_15px_rgba(247,171,197,0.5)]"
              title="Kembali ke Beranda"
            >
              <span className="text-sm font-bold text-[#3F3766] group-hover:-translate-x-0.5 transition-transform">←</span>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-wider uppercase text-[#3F3766]">
                  Studio Canvas
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#F7ABC5]/30 px-2 py-0.5 text-[10px] font-bold text-[#3F3766] border border-[#F7ABC5]/50 shadow-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Live Sync
                </span>
              </div>
              <p className="text-[11px] font-mono font-medium text-[#3F3766]/70 truncate max-w-[200px] sm:max-w-xs">
                {domainPreview}
              </p>
            </div>
          </div>

          {/* Viewport Switcher & Actions */}
          <div className="flex items-center gap-3">
            {/* Desktop / Mobile Switcher */}
            <div className="hidden md:flex items-center rounded-xl bg-white/70 p-1 border border-[#3F3766]/15 shadow-inner">
              <button
                type="button"
                onClick={() => setPreviewDevice("desktop")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  previewDevice === "desktop"
                    ? "bg-[#3F3766] text-white shadow-md shadow-[#3F3766]/20"
                    : "text-[#3F3766]/70 hover:text-[#3F3766]"
                }`}
              >
                <span>🖥️</span> Desktop
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice("mobile")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  previewDevice === "mobile"
                    ? "bg-[#3F3766] text-white shadow-md shadow-[#3F3766]/20"
                    : "text-[#3F3766]/70 hover:text-[#3F3766]"
                }`}
              >
                <span>📱</span> Mobile
              </button>
            </div>

            {/* 3D Terbitkan CTA Button */}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="relative inline-flex items-center justify-center gap-2 rounded-xl bg-[#F7ABC5] px-5 py-2.5 text-xs font-black tracking-wide text-[#3F3766] uppercase shadow-[0_4px_0_0_#3F3766] hover:shadow-[0_2px_0_0_#3F3766] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px] transition-all border-2 border-[#3F3766] disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin text-sm">⏳</span> Menerbitkan...
                </>
              ) : (
                <>
                  <span>🚀</span> Terbitkan Blog
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* 2. SPLIT WORKSPACE: LEFT EDITOR DOCK + RIGHT LIVE CANVAS */}
      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* PANEL KIRI: CONTROL DOCK (COL-SPAN-5) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* TABS: EDITOR vs SETTINGS */}
            <div className="flex rounded-2xl bg-white/70 p-1.5 border border-[#3F3766]/15 shadow-sm">
              <button
                type="button"
                onClick={() => setActiveTab("editor")}
                className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition-all ${
                  activeTab === "editor"
                    ? "bg-[#3F3766] text-[#F5E7C6] shadow-md shadow-[#3F3766]/25"
                    : "text-[#3F3766]/70 hover:text-[#3F3766]"
                }`}
              >
                ✍️ Tulis & Template
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("settings")}
                className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition-all ${
                  activeTab === "settings"
                    ? "bg-[#3F3766] text-[#F5E7C6] shadow-md shadow-[#3F3766]/25"
                    : "text-[#3F3766]/70 hover:text-[#3F3766]"
                }`}
              >
                ⚙️ Subdomain & Web3
              </button>
            </div>

            {error && (
              <div className="rounded-2xl border-2 border-red-400 bg-red-50 p-4 text-xs font-bold text-red-800 shadow-sm flex items-center gap-2">
                <span>⚠️</span> {error}
              </div>
            )}

            {activeTab === "editor" ? (
              <div className="space-y-6">
                {/* PILIHAN TEMPLATE QUICK PILLS */}
                <div className="rounded-3xl bg-white p-5 border-2 border-[#3F3766]/15 shadow-[0_6px_0_0_#3F3766]/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-black uppercase tracking-wider text-[#3F3766] flex items-center gap-1.5">
                      <span>🪄</span> Pilih Mood / Template
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
                              : "border-[#3F3766]/15 bg-white hover:border-[#F7ABC5] hover:bg-[#F5E7C6]/30"
                          }`}
                        >
                          <div className="text-xl mb-1">{tmpl.icon}</div>
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

                {/* FORM INPUTS */}
                <div className="rounded-3xl bg-white p-6 border-2 border-[#3F3766]/15 shadow-[0_6px_0_0_#3F3766]/10 space-y-4">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-[#3F3766] mb-1.5">
                      Judul Refleksi <span className="text-[#F7ABC5]">*</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Apa yang ada di hatimu hari ini?"
                      required
                      className="w-full rounded-2xl border-2 border-[#3F3766]/15 bg-white px-4 py-3 text-sm font-bold text-[#3F3766] placeholder:text-[#3F3766]/40 focus:border-[#3F3766] focus:ring-4 focus:ring-[#F7ABC5]/30 focus:outline-none transition shadow-inner"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-[#3F3766] mb-1.5">
                      Catatan Singkat / Excerpt
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
                        Isi Jurnal & Perjalanan <span className="text-[#F7ABC5]">*</span>
                      </label>
                      <span className="text-[10px] font-mono font-bold text-[#3F3766]/60">
                        {content.length} karakter
                      </span>
                    </div>
                    <textarea
                      rows={10}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Ceritakan dengan bebas tanpa takut dinilai. Tempat ini mendengar..."
                      required
                      className="w-full rounded-2xl border-2 border-[#3F3766]/15 bg-white p-4 text-xs font-medium text-[#3F3766] placeholder:text-[#3F3766]/40 leading-relaxed focus:border-[#3F3766] focus:ring-4 focus:ring-[#F7ABC5]/30 focus:outline-none transition font-sans resize-y shadow-inner"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-[#3F3766] mb-1.5">
                      Tags / Kategori (Pisahkan koma)
                    </label>
                    <input
                      type="text"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      placeholder="SelfCare, Pemulihan, Mindfulness"
                      className="w-full rounded-2xl border-2 border-[#3F3766]/15 bg-white px-4 py-2 text-xs font-semibold text-[#3F3766] placeholder:text-[#3F3766]/40 focus:border-[#3F3766] focus:ring-4 focus:ring-[#F7ABC5]/30 focus:outline-none transition"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* SETTINGS: SUBDOMAIN IDENTITAS */}
                <div className="rounded-3xl bg-white p-6 border-2 border-[#3F3766]/15 shadow-[0_6px_0_0_#3F3766]/10 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🌐</span>
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-[#3F3766]">
                        Subdomain Khusus Anda
                      </h3>
                      <p className="text-[11px] text-[#3F3766]/60">
                        Alamat permanen blog refleksi Anda tanpa hosting rumit.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-[#3F3766] mb-1.5">
                      Pilih Username
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-4 font-mono font-bold text-sm text-[#3F3766]/40">
                        @
                      </span>
                      <input
                        type="text"
                        value={username}
                        onChange={handleUsernameChange}
                        placeholder="contoh: axaa, amir, sarah"
                        required
                        className="w-full rounded-2xl border-2 border-[#3F3766]/15 bg-[#F5E7C6]/30 py-3 pl-9 pr-4 text-sm font-mono font-bold text-[#3F3766] placeholder:text-[#3F3766]/40 focus:border-[#3F3766] focus:bg-white focus:ring-4 focus:ring-[#F7ABC5]/30 focus:outline-none transition shadow-inner"
                      />
                    </div>
                  </div>

                  {/* DOMAIN PREVIEW PILL GLOW */}
                  <div className="rounded-2xl border-2 border-[#F7ABC5] bg-gradient-to-br from-[#F7ABC5]/15 to-white p-4 shadow-[0_0_20px_rgba(247,171,197,0.3)] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#3F3766] flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Wildcard Subdomain Siap Pakai
                      </span>
                    </div>
                    <p className="font-mono text-xs font-bold text-[#3F3766] break-all">
                      {domainPreview}
                    </p>
                  </div>
                </div>

                {/* SETTINGS: LITERA WEB3 INTEGRATION */}
                <div className="rounded-3xl bg-white p-6 border-2 border-[#3F3766]/15 shadow-[0_6px_0_0_#3F3766]/10 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider text-[#3F3766] flex items-center gap-1.5">
                        <span>💎</span> Sertifikat Web3 Litera
                      </span>
                      <p className="text-[11px] text-[#3F3766]/70 leading-relaxed mt-1">
                        Daftarkan tulisan Anda ke smart contract Litera di Polygon agar memiliki bukti kepemilikan abadi.
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
                    <div className="pt-3 border-t border-[#3F3766]/10 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#3F3766]">Dompet Penulis</span>
                        <button
                          type="button"
                          onClick={() => setIsLoginModalOpen(true)}
                          className="text-xs font-black text-[#3F3766] underline hover:text-[#F7ABC5]"
                        >
                          {creatorWallet ? "Ganti Dompet" : "Hubungkan"}
                        </button>
                      </div>

                      {creatorWallet ? (
                        <div className="p-3 bg-[#F7ABC5]/15 rounded-2xl border-2 border-[#F7ABC5] flex items-center gap-3">
                          <span className="h-7 w-7 rounded-xl bg-[#3F3766] text-white flex items-center justify-center text-xs font-black">
                            ✓
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-[#3F3766] truncate">{loginMethod || "Litera Wallet"}</p>
                            <p className="text-[10px] font-mono text-[#3F3766]/70 truncate">{creatorWallet}</p>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsLoginModalOpen(true)}
                          className="w-full py-3 px-4 rounded-2xl border-2 border-dashed border-[#3F3766] bg-white hover:bg-[#F7ABC5]/20 text-xs font-black text-[#3F3766] flex items-center justify-center gap-2 transition"
                        >
                          <span>🔐</span> Hubungkan Akun Litera Cloud (Google/Email)
                        </button>
                      )}

                      {/* KOLEKSI NFT */}
                      <div>
                        <label className="block text-xs font-bold text-[#3F3766] mb-1">
                          Koleksi Litera
                        </label>
                        <select
                          value={selectedCollection}
                          onChange={(e) => setSelectedCollection(e.target.value)}
                          className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border-2 border-[#3F3766]/15 bg-white text-[#3F3766] focus:outline-none focus:border-[#3F3766]"
                        >
                          <option value="">Let Me Hear You - Jurnal & Refleksi (Default)</option>
                          <option value="Ruang Pemulihan & Self-Care">Ruang Pemulihan & Self-Care</option>
                          <option value="Jurnal Mindfulness Harian">Jurnal Mindfulness Harian</option>
                          <option value="__new__">➕ Buat Koleksi Baru...</option>
                        </select>

                        {selectedCollection === "__new__" && (
                          <div className="mt-2 p-3 rounded-2xl bg-white border-2 border-[#F7ABC5] space-y-2">
                            <label className="block text-[11px] font-bold text-[#3F3766]">
                              Nama Koleksi Baru
                            </label>
                            <input
                              type="text"
                              value={newCollectionName}
                              onChange={(e) => setNewCollectionName(e.target.value)}
                              placeholder="Misal: Catatan Jiwa Teduh"
                              className="w-full text-xs px-3 py-2 rounded-xl border border-[#3F3766]/20 focus:outline-none focus:border-[#3F3766]"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* PANEL KANAN: LIVE BROWSER MOCKUP CANVAS (COL-SPAN-7) */}
          <div className="lg:col-span-7 sticky top-20">
            <div className="flex flex-col items-center">
              
              {/* CANVAS CONTAINER WITH 3D SHADOW & GLOW */}
              <div
                className={`w-full transition-all duration-300 ${
                  previewDevice === "mobile" ? "max-w-sm" : "max-w-full"
                }`}
              >
                <div className="rounded-[32px] border-4 border-[#3F3766] bg-white shadow-[0_16px_40px_rgba(63,55,102,0.18),0_0_24px_rgba(247,171,197,0.3)] overflow-hidden transition-all">
                  
                  {/* BROWSER TOP BAR */}
                  <div className="bg-[#3F3766] px-4 py-3 flex items-center justify-between gap-3 border-b-2 border-[#3F3766]">
                    {/* Window Dots */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="h-3 w-3 rounded-full bg-[#FF5F56] border border-black/20"></span>
                      <span className="h-3 w-3 rounded-full bg-[#FFBD2E] border border-black/20"></span>
                      <span className="h-3 w-3 rounded-full bg-[#27C93F] border border-black/20"></span>
                    </div>

                    {/* Simulated URL Bar */}
                    <div className="flex-1 max-w-sm mx-auto flex items-center justify-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-mono font-medium text-[#F5E7C6] border border-white/15 truncate shadow-inner">
                      <span className="text-[#F7ABC5]">🔒</span>
                      <span className="truncate">{cleanUser}.{activeBaseDomain}</span>
                    </div>

                    <div className="w-8 shrink-0 text-right">
                      <span className="text-[10px] font-mono text-[#F7ABC5]">LIVE</span>
                    </div>
                  </div>

                  {/* SIMULATED TENANT BLOG PAGE CONTENT */}
                  <div className="p-6 sm:p-8 min-h-[460px] max-h-[580px] overflow-y-auto space-y-6 bg-gradient-to-b from-[#F5E7C6]/20 via-white to-white">
                    
                    {/* Simulated Blog Header */}
                    <div className="border-b border-[#3F3766]/10 pb-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-[#F7ABC5] text-[#3F3766] flex items-center justify-center text-xs font-black shadow-sm">
                          {cleanUser.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-black text-[#3F3766]">@{cleanUser}</p>
                          <p className="text-[10px] text-[#3F3766]/60">Ruang Refleksi Pribadi</p>
                        </div>
                      </div>

                      {registerLitera && (
                        <span className="rounded-full bg-[#3F3766] px-2.5 py-0.5 text-[9px] font-bold text-[#F7ABC5] flex items-center gap-1 shadow-sm">
                          <span>💎</span> Web3 Verified
                        </span>
                      )}
                    </div>

                    {/* Article Body */}
                    <article className="space-y-4">
                      {/* Tags */}
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

                      {/* Title */}
                      <h1 className="text-xl sm:text-2xl font-black text-[#3F3766] leading-snug tracking-tight">
                        {title || "Judul Refleksi Anda Akan Tampil di Sini"}
                      </h1>

                      {/* Excerpt */}
                      {excerpt && (
                        <p className="text-xs sm:text-sm font-semibold italic text-[#3F3766]/70 border-l-2 border-[#F7ABC5] pl-3 py-0.5">
                          &ldquo;{excerpt}&rdquo;
                        </p>
                      )}

                      {/* Main Content Rendered */}
                      <div className="text-xs sm:text-sm text-[#3F3766]/85 font-medium leading-relaxed whitespace-pre-wrap font-sans pt-2">
                        {content || "Tuliskan cerita, perasaan, atau perjalanan pemulihan Anda di panel editor sebelah kiri untuk melihat keajaibannya di sini secara live..."}
                      </div>
                    </article>

                    {/* Simulated Article Footer */}
                    <div className="pt-6 border-t border-[#3F3766]/10 flex items-center justify-between text-[10px] text-[#3F3766]/50">
                      <span>Diterbitkan via Let Me Hear You</span>
                      <span className="font-mono">Hari ini</span>
                    </div>
                  </div>
                </div>

                {/* Subtle Base Stand Shadow */}
                <div className="mx-auto h-2 w-3/4 rounded-full bg-[#3F3766]/10 blur-sm mt-3"></div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* MODAL AUTH LITERA */}
      <LiteraLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={handleLoginSuccess}
      />
    </div>
  );
}
