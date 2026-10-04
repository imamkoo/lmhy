"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  verifyAdminPin,
  getAdminLiteraQuotaAction,
  getAdminLiteraTokenomicsAction,
} from "@/app/actions/admin-nft";
import { LiteraPublisherQuota, LiteraPublisherTokenomics } from "@/lib/litera";

export function AdminLiteraClient() {
  // 1. PIN Security Gate (Default: 123456)
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [inputPin, setInputPin] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [isCheckingPin, setIsCheckingPin] = useState(false);

  // 2. Litera Quota & Credits State (Free Kuota & Paid Credits)
  const [quotaData, setQuotaData] = useState<LiteraPublisherQuota | null>(null);
  const [hasApiKey, setHasApiKey] = useState<boolean>(true);
  const [quotaError, setQuotaError] = useState<string | null>(null);
  const [isLoadingQuota, setIsLoadingQuota] = useState(true);

  // 3. Litera Single Source of Truth Tokenomics Policy State
  const [tokenomicsData, setTokenomicsData] = useState<LiteraPublisherTokenomics | null>(null);
  const [isLoadingTokenomics, setIsLoadingTokenomics] = useState(true);

  // Load Litera quota & Tokenomics policy on mount
  useEffect(() => {
    getAdminLiteraQuotaAction()
      .then((res) => {
        setQuotaData(res.quota);
        setHasApiKey(res.hasApiKey);
        setQuotaError(res.error || null);
      })
      .finally(() => {
        setIsLoadingQuota(false);
      });

    getAdminLiteraTokenomicsAction()
      .then((data) => {
        setTokenomicsData(data);
      })
      .finally(() => {
        setIsLoadingTokenomics(false);
      });
  }, []);

  // Handle PIN verification
  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);
    setIsCheckingPin(true);

    try {
      const isValid = await verifyAdminPin(inputPin);
      if (isValid) {
        setIsAuthenticated(true);
      } else {
        setPinError("PIN Admin salah. Default PIN adalah 123456.");
      }
    } catch {
      setPinError("Terjadi kesalahan saat memverifikasi PIN.");
    } finally {
      setIsCheckingPin(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5E7C6] text-[#3F3766] flex flex-col font-sans">
      {/* 0. PIN GATE SECURITY MODAL */}
      {!isAuthenticated && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3F3766]/75 backdrop-blur-md p-4">
          <div className="w-full max-w-sm rounded-3xl border-4 border-[#3F3766] bg-[#F5E7C6] p-6 sm:p-8 shadow-[0_20px_60px_rgba(63,55,102,0.4)] text-center">
            <span className="inline-block rounded-xl bg-[#3F3766] px-3 py-1 text-[11px] font-black uppercase tracking-wider text-[#F7ABC5] mb-3">
              Keamanan Terpusat
            </span>
            <h2 className="text-xl font-black text-[#3F3766] tracking-tight">
              Akses Admin Litera
            </h2>
            <p className="mt-1 text-xs text-[#3F3766]/70 leading-relaxed">
              Masukkan PIN Admin untuk memantau status kuota dan kebijakan tokenomics platform.
            </p>

            <form onSubmit={handleVerifyPin} className="mt-6 space-y-4">
              <div>
                <input
                  type="password"
                  maxLength={10}
                  value={inputPin}
                  onChange={(e) => setInputPin(e.target.value)}
                  placeholder="Masukkan PIN (Default: 123456)"
                  autoFocus
                  required
                  className="w-full text-center text-xl font-mono font-bold tracking-widest py-3 px-4 rounded-2xl border-2 border-[#3F3766] bg-white text-[#3F3766] focus:outline-none focus:ring-4 focus:ring-[#F7ABC5] shadow-inner"
                />
                {pinError && (
                  <p className="mt-2 text-xs font-bold text-red-600">
                    {pinError}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isCheckingPin}
                className="w-full py-3.5 rounded-2xl bg-[#F7ABC5] text-[#3F3766] border-2 border-[#3F3766] text-xs font-black uppercase tracking-wider shadow-[0_4px_0_0_#3F3766] hover:shadow-[0_2px_0_0_#3F3766] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px] transition-all disabled:opacity-50"
              >
                {isCheckingPin ? "Memverifikasi..." : "Buka Portal"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 1. TOP HEADER NAVIGATION */}
      <header className="sticky top-0 z-30 border-b border-[#3F3766]/15 bg-[#F5E7C6]/90 backdrop-blur-md px-4 py-3.5 sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/builder"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border-2 border-[#3F3766]/20 shadow-sm transition hover:border-[#3F3766]"
              title="Kembali ke Studio Web Builder"
            >
              <span className="text-xs font-black text-[#3F3766]">←</span>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-wider uppercase text-[#3F3766]">
                  Status Integrasi & Tokenomics Litera
                </span>
                <span className="inline-flex items-center rounded-full bg-[#3F3766] px-2 py-0.5 text-[9px] font-bold text-[#F7ABC5]">
                  Single Source of Truth
                </span>
              </div>
              <p className="text-[11px] text-[#3F3766]/70">
                Let Me Hear You otomatis menerapkan konfigurasi tokenomics dan kuota resmi dari Dashboard Litera
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/builder"
              className="inline-flex items-center rounded-xl bg-white/80 px-4 py-2 text-xs font-bold text-[#3F3766] border-2 border-[#3F3766]/20 hover:border-[#3F3766] transition shadow-sm"
            >
              Kembali ke Studio
            </Link>
          </div>
        </div>
      </header>

      {/* 2. MAIN CONTENT */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 space-y-6">
        
        {/* INFORMASI FREE KUOTA & KREDIT PUBLISHER LITERA */}
        <div className="rounded-3xl bg-white p-6 sm:p-7 border-2 border-[#3F3766]/15 shadow-[0_8px_0_0_#3F3766]/10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#3F3766]/10 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-[#3F3766]">
                  Status Kuota Penerbit & Saldo Kredit (Litera Protocol)
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-bold border ${
                    hasApiKey && quotaData
                      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                      : "bg-amber-100 text-amber-800 border-amber-300"
                  }`}
                >
                  {hasApiKey && quotaData ? "Live S2S Terhubung" : "Konfigurasi API Key"}
                </span>
              </div>
              <p className="text-[11px] text-[#3F3766]/65 mt-0.5">
                {quotaData?.publisherWallet
                  ? `Wallet Penerbit: ${quotaData.publisherWallet}`
                  : "Kuota pencetakan otomatis (auto-minting) dan kredit aktif akun penerbit Let Me Hear You"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsLoadingQuota(true);
                  setIsLoadingTokenomics(true);
                  getAdminLiteraQuotaAction()
                    .then((res) => {
                      setQuotaData(res.quota);
                      setHasApiKey(res.hasApiKey);
                      setQuotaError(res.error || null);
                    })
                    .finally(() => setIsLoadingQuota(false));
                  getAdminLiteraTokenomicsAction()
                    .then((data) => setTokenomicsData(data))
                    .finally(() => setIsLoadingTokenomics(false));
                }}
                disabled={isLoadingQuota}
                className="inline-flex items-center justify-center rounded-xl bg-white px-3 py-2 text-xs font-bold text-[#3F3766] border-2 border-[#3F3766]/20 hover:border-[#3F3766] transition shadow-sm disabled:opacity-50"
                title="Muat ulang status dari server Litera"
              >
                {isLoadingQuota ? "Memuat..." : "Refresh Status"}
              </button>
              <a
                href="https://literaa.xyz/publisher/integrasi"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-xl bg-[#F5E7C6] px-3.5 py-2 text-xs font-black text-[#3F3766] border-2 border-[#3F3766]/20 hover:border-[#3F3766] transition shadow-sm w-fit"
              >
                Buka Dashboard Litera ↗
              </a>
            </div>
          </div>

          {!hasApiKey ? (
            <div className="mt-4 rounded-2xl bg-amber-50 border-2 border-amber-300 p-4 text-xs font-semibold text-amber-900 space-y-1">
              <p className="font-bold">LITERA_API_KEY belum terkonfigurasi di server environment.</p>
              <p className="text-[11px] text-amber-800">
                Silakan tambahkan <strong>LITERA_API_KEY</strong> di file <code>.env</code> lokal atau di menu <strong>Settings → Environment Variables</strong> Vercel untuk menghubungkan kuota penerbit secara realtime.
              </p>
            </div>
          ) : quotaError && !quotaData ? (
            <div className="mt-4 rounded-2xl bg-red-50 border-2 border-red-300 p-4 text-xs font-semibold text-red-900 space-y-1">
              <p className="font-bold">Gagal mengambil data kuota dari server Litera:</p>
              <p className="text-[11px] text-red-800">{quotaError}</p>
            </div>
          ) : null}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
            {/* 1. FREE KUOTA */}
            <div className="p-4 rounded-2xl bg-[#F5E7C6]/30 border-2 border-[#3F3766]/15 space-y-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#3F3766]/70 block">
                Free Kuota Tersisa
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black font-mono text-[#3F3766]">
                  {isLoadingQuota ? "..." : (quotaData?.freeRemaining ?? 0)}
                </span>
                <span className="text-[10px] font-bold text-[#3F3766]/60">
                  / {quotaData?.freeQuota ?? 0} artikel gratis
                </span>
              </div>
              <p className="text-[10px] text-[#3F3766]/60 leading-tight pt-1">
                Terpakai: {quotaData?.usedFreeQuota ?? 0} artikel
              </p>
            </div>

            {/* 2. PAID CREDITS */}
            <div className="p-4 rounded-2xl bg-[#F5E7C6]/30 border-2 border-[#3F3766]/15 space-y-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#3F3766]/70 block">
                Saldo Kredit (Credits)
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black font-mono text-[#3F3766]">
                  {isLoadingQuota ? "..." : (quotaData?.creditsRemaining ?? 0)}
                </span>
                <span className="text-[10px] font-bold text-[#3F3766]/60">
                  Kredit Aktif
                </span>
              </div>
              <p className="text-[10px] text-[#3F3766]/60 leading-tight pt-1">
                Total Top Up: {quotaData?.paidCredits ?? 0} | Terpakai: {quotaData?.usedPaidCredits ?? 0}
              </p>
            </div>

            {/* 3. TOTAL KUOTA TERSEDIA */}
            <div className="p-4 rounded-2xl bg-[#3F3766] text-[#F5E7C6] space-y-1 shadow-inner">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#F7ABC5] block">
                Total Kapasitas Terbit
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black font-mono text-white">
                  {isLoadingQuota ? "..." : (quotaData?.totalRemaining ?? 0)}
                </span>
                <span className="text-[10px] font-bold text-[#F5E7C6]/75">
                  Slot Artikel Siap Mint
                </span>
              </div>
              <p className="text-[10px] text-[#F5E7C6]/70 leading-tight pt-1">
                Kombinasi Free Kuota + Paid Credits
              </p>
            </div>
          </div>
        </div>

        {/* KEBIJAKAN TOKENOMICS AKTIF DARI LITERA (READ ONLY - SOURCE OF TRUTH) */}
        <div className="rounded-3xl bg-white p-6 sm:p-8 border-2 border-[#3F3766]/15 shadow-[0_8px_0_0_#3F3766]/10 space-y-6">
          <div className="border-b border-[#3F3766]/10 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-[#3F3766]">
                  Kebijakan Tokenomics & Royalti Aktif (Terhubung S2S)
                </span>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                  Dikelola Terpusat di Litera
                </span>
              </div>
              <p className="text-[11px] text-[#3F3766]/65 mt-1 leading-relaxed">
                Parameter di bawah ini diterapkan secara otomatis ke setiap artikel yang diterbitkan oleh pengguna tanpa perlu konfigurasi lokal berulang.
              </p>
            </div>
            <a
              href={
                quotaData?.publisherWallet
                  ? `https://literaa.xyz/publisher/integration?publisher=${quotaData.publisherWallet}`
                  : "https://literaa.xyz/publisher/integration"
              }
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-xl bg-[#F7ABC5] border-2 border-[#3F3766] px-4 py-2 text-xs font-black text-[#3F3766] shadow-[0_3px_0_0_#3F3766] hover:translate-y-[2px] transition self-start sm:self-auto shrink-0"
            >
              Ubah Kebijakan di Litera ↗
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-[#F5E7C6]/30 border-2 border-[#3F3766]/15 space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#3F3766]/70 block">
                User Reward (Cashback)
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black font-mono text-[#3F3766]">
                  {isLoadingTokenomics ? "..." : (tokenomicsData?.userReward ?? 0)}
                </span>
                <span className="text-xs font-bold text-[#3F3766]/60">LITE</span>
              </div>
              <p className="text-[10px] text-[#3F3766]/60">Diberikan ke pembaca per mint</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#F5E7C6]/30 border-2 border-[#3F3766]/15 space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#3F3766]/70 block">
                Creator Mint Reward
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black font-mono text-[#3F3766]">
                  {isLoadingTokenomics ? "..." : (tokenomicsData?.creatorMintReward ?? 0)}
                </span>
                <span className="text-xs font-bold text-[#3F3766]/60">LITE</span>
              </div>
              <p className="text-[10px] text-[#3F3766]/60">Royalti penulis per NFT terjual</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#F5E7C6]/30 border-2 border-[#3F3766]/15 space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#3F3766]/70 block">
                Creator Approve Reward
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black font-mono text-[#3F3766]">
                  {isLoadingTokenomics ? "..." : (tokenomicsData?.creatorApproveReward ?? 0)}
                </span>
                <span className="text-xs font-bold text-[#3F3766]/60">LITE</span>
              </div>
              <p className="text-[10px] text-[#3F3766]/60">Bonus penerbitan pertama kali</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-white border-2 border-[#3F3766]/15 space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#3F3766]/70 block">
                Batas Suplai (Max Mint)
              </span>
              <span className="text-xl font-black font-mono text-[#3F3766]">
                {isLoadingTokenomics ? "..." : (tokenomicsData?.maxMinted ?? 100)}
              </span>
              <p className="text-[10px] text-[#3F3766]/60">Total edisi NFT per artikel</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border-2 border-[#3F3766]/15 space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#3F3766]/70 block">
                Biaya Minting (Price)
              </span>
              <span className="text-xl font-black font-mono text-[#3F3766]">
                {isLoadingTokenomics
                  ? "..."
                  : tokenomicsData?.feeEnabled
                  ? `${tokenomicsData?.price ?? 0} LITE`
                  : "Gratis (Free Mint)"}
              </span>
              <p className="text-[10px] text-[#3F3766]/60">Biaya yang dibayar pembaca</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border-2 border-[#3F3766]/15 space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#3F3766]/70 block">
                Koleksi Default
              </span>
              <span className="text-sm font-black text-[#3F3766] truncate block">
                {isLoadingTokenomics
                  ? "..."
                  : tokenomicsData?.defaultCollectionName || "Default Platform"}
              </span>
              <p className="text-[10px] text-[#3F3766]/60">Wadah otomatis artikel baru</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#3F3766] text-[#F5E7C6] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-lg">🛡️</span>
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-[#F7ABC5] block">
                  Status Fleksibilitas (Allow Article Override)
                </span>
                <p className="text-[11px] text-[#F5E7C6]/75">
                  {tokenomicsData?.allowArticleOverride
                    ? "Publisher mengizinkan artikel tertentu menentukan royalti kustom."
                    : "Terkunci Ketat: Semua artikel 100% wajib mematuhi parameter standar di atas."}
                </p>
              </div>
            </div>
            <span
              className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                tokenomicsData?.allowArticleOverride
                  ? "bg-amber-100 text-amber-900 border-amber-300"
                  : "bg-emerald-100 text-emerald-900 border-emerald-300"
              }`}
            >
              {tokenomicsData?.allowArticleOverride ? "Fleksibel" : "Terkunci (Ketat)"}
            </span>
          </div>
        </div>

      </main>
    </div>
  );
}
