"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  verifyAdminPin,
  getTokenomicsConfigAction,
  saveTokenomicsConfigAction,
  getAdminLiteraQuotaAction,
} from "@/app/actions/admin-nft";
import { LiteraPublisherQuota } from "@/lib/litera";

export function AdminLiteraClient() {
  // 1. PIN Security Gate (Default: 123456)
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [inputPin, setInputPin] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [isCheckingPin, setIsCheckingPin] = useState(false);

  // 2. Tokenomics & Deposit State (Matching Image 1 Exactly)
  const [userReward, setUserReward] = useState<number>(0);
  const [creatorReward, setCreatorReward] = useState<number>(0);
  const [creatorApproveReward, setCreatorApproveReward] = useState<number>(0);
  const [maxMint, setMaxMint] = useState<number>(100);
  const [mintingFeeEnabled, setMintingFeeEnabled] = useState<boolean>(false);
  const [priceLite, setPriceLite] = useState<number>(0);
  const [isDepositConfirmed, setIsDepositConfirmed] = useState<boolean>(false);

  // 3. UI Status State
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // 4. Litera Quota & Credits State (Free Kuota & Paid Credits)
  const [quotaData, setQuotaData] = useState<LiteraPublisherQuota | null>(null);
  const [hasApiKey, setHasApiKey] = useState<boolean>(true);
  const [quotaError, setQuotaError] = useState<string | null>(null);
  const [isLoadingQuota, setIsLoadingQuota] = useState(true);

  // Load existing tokenomics config & Litera quota on mount
  useEffect(() => {
    getTokenomicsConfigAction().then((cfg) => {
      if (cfg) {
        setUserReward(cfg.userReward);
        setCreatorReward(cfg.creatorReward);
        setCreatorApproveReward(cfg.creatorApproveReward);
        setMaxMint(cfg.maxMint);
        setMintingFeeEnabled(cfg.mintingFeeEnabled);
        setPriceLite(cfg.priceLite);
        setIsDepositConfirmed(cfg.isDepositConfirmed);
      }
    });

    getAdminLiteraQuotaAction()
      .then((res) => {
        setQuotaData(res.quota);
        setHasApiKey(res.hasApiKey);
        setQuotaError(res.error || null);
      })
      .finally(() => {
        setIsLoadingQuota(false);
      });
  }, []);

  // Realtime Total Deposit LITE Calculation
  const totalDeposit =
    (Number(userReward) || 0) * (Number(maxMint) || 0) +
    (Number(creatorReward) || 0) * (Number(maxMint) || 0) +
    (Number(creatorApproveReward) || 0);

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

  // Handle Save Configuration
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (totalDeposit > 0 && !isDepositConfirmed) {
      setStatusMessage({
        type: "error",
        text: "Terdapat alokasi deposit LITE. Anda wajib mencentang konfirmasi deposit Non-Refundable.",
      });
      return;
    }

    setIsSaving(true);

    try {
      const res = await saveTokenomicsConfigAction({
        userReward: Number(userReward) || 0,
        creatorReward: Number(creatorReward) || 0,
        creatorApproveReward: Number(creatorApproveReward) || 0,
        maxMint: Number(maxMint) || 100,
        mintingFeeEnabled,
        priceLite: mintingFeeEnabled ? Number(priceLite) || 0 : 0,
        isDepositConfirmed,
      });

      if (res.success) {
        setStatusMessage({
          type: "success",
          text: res.message || "Konfigurasi tokenomics berhasil disimpan.",
        });
      } else {
        setStatusMessage({
          type: "error",
          text: res.message || "Gagal menyimpan konfigurasi tokenomics.",
        });
      }
    } catch (err) {
      setStatusMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5E7C6] text-[#3F3766] flex flex-col font-sans">
      {/* 0. PIN GATE SECURITY MODAL (DEFAULT PIN: 123456) */}
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
              Masukkan PIN Admin untuk mengonfigurasi parameter tokenomics platform.
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
                {isCheckingPin ? "Memverifikasi..." : "Buka Pengaturan"}
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
                  Pengaturan Tokenomics Platform (Admin Setting)
                </span>
                <span className="inline-flex items-center rounded-full bg-[#3F3766] px-2 py-0.5 text-[9px] font-bold text-[#F7ABC5]">
                  Litera Protocol
                </span>
              </div>
              <p className="text-[11px] text-[#3F3766]/70">
                Konfigurasi ekonomi digital terpusat yang otomatis diterapkan ke setiap artikel yang diterbitkan pengguna
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

      {/* 2. MAIN CONTENT (MATCHING IMAGE 1 EXACTLY) */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        
        {/* NOTIFICATION STATUS BANNER */}
        {statusMessage && (
          <div
            className={`mb-6 rounded-2xl border-2 p-4 text-xs font-bold shadow-sm leading-relaxed ${
              statusMessage.type === "success"
                ? "border-emerald-600 bg-emerald-50 text-emerald-900"
                : "border-red-500 bg-red-50 text-red-900"
            }`}
          >
            {statusMessage.text}
          </div>
        )}

        {/* INFORMASI FREE KUOTA & KREDIT PUBLISHER LITERA */}
        <div className="mb-6 rounded-3xl bg-white p-6 sm:p-7 border-2 border-[#3F3766]/15 shadow-[0_8px_0_0_#3F3766]/10">
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
                  getAdminLiteraQuotaAction()
                    .then((res) => {
                      setQuotaData(res.quota);
                      setHasApiKey(res.hasApiKey);
                      setQuotaError(res.error || null);
                    })
                    .finally(() => {
                      setIsLoadingQuota(false);
                    });
                }}
                disabled={isLoadingQuota}
                className="inline-flex items-center justify-center rounded-xl bg-white px-3 py-2 text-xs font-bold text-[#3F3766] border-2 border-[#3F3766]/20 hover:border-[#3F3766] transition shadow-sm disabled:opacity-50"
                title="Muat ulang status kuota dari server Litera"
              >
                {isLoadingQuota ? "Memuat..." : "Refresh"}
              </button>
              <a
                href="https://literaa.xyz"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-xl bg-[#F5E7C6] px-3.5 py-2 text-xs font-black text-[#3F3766] border-2 border-[#3F3766]/20 hover:border-[#3F3766] transition shadow-sm w-fit"
              >
                Top Up di Litera →
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

        <form onSubmit={handleSaveConfig} className="space-y-6">
          
          {/* PENGATURAN TOKENOMICS & DEPOSIT (REWARD LITE) - [IMAGE 1] */}
          <div className="rounded-3xl bg-white p-6 sm:p-8 border-2 border-[#3F3766]/15 shadow-[0_8px_0_0_#3F3766]/10 space-y-6">
            <div className="border-b border-[#3F3766]/10 pb-3 flex items-center justify-between">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-[#3F3766]">
                  Pengaturan Tokenomics & Deposit (Reward LITE)
                </span>
                <p className="text-[11px] text-[#3F3766]/65 mt-0.5">
                  Struktur insentif pembaca, royalti kreator, dan alokasi deposit smart contract
                </p>
              </div>
              <span className="text-[10px] font-bold text-[#3F3766] bg-[#F7ABC5] px-2.5 py-0.5 rounded-full border border-[#3F3766]/20">
                Admin Managed
              </span>
            </div>

            {/* 3-COLUMN INPUT GRID (IMAGE 1) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* USER REWARD */}
              <div className="p-4 rounded-2xl bg-[#F5E7C6]/30 border-2 border-[#3F3766]/15 space-y-1.5">
                <label className="block text-xs font-black uppercase tracking-wider text-[#3F3766]">
                  User Reward
                </label>
                <p className="text-[10px] text-[#3F3766]/65 leading-tight">
                  Cashback untuk pembaca per mint
                </p>
                <input
                  type="number"
                  min={0}
                  value={userReward}
                  onChange={(e) => setUserReward(Number(e.target.value))}
                  className="w-full text-base font-bold font-mono px-3.5 py-2.5 rounded-xl border-2 border-[#3F3766]/20 bg-white focus:outline-none focus:border-[#3F3766]"
                />
              </div>

              {/* CREATOR REWARD */}
              <div className="p-4 rounded-2xl bg-[#F5E7C6]/30 border-2 border-[#3F3766]/15 space-y-1.5">
                <label className="block text-xs font-black uppercase tracking-wider text-[#3F3766]">
                  Creator Reward
                </label>
                <p className="text-[10px] text-[#3F3766]/65 leading-tight">
                  Royalti untuk creator per NFT terjual
                </p>
                <input
                  type="number"
                  min={0}
                  value={creatorReward}
                  onChange={(e) => setCreatorReward(Number(e.target.value))}
                  className="w-full text-base font-bold font-mono px-3.5 py-2.5 rounded-xl border-2 border-[#3F3766]/20 bg-white focus:outline-none focus:border-[#3F3766]"
                />
              </div>

              {/* CREATOR APPROVE REWARD */}
              <div className="p-4 rounded-2xl bg-[#F5E7C6]/30 border-2 border-[#3F3766]/15 space-y-1.5">
                <label className="block text-xs font-black uppercase tracking-wider text-[#3F3766]">
                  Creator Approve Reward
                </label>
                <p className="text-[10px] text-[#3F3766]/65 leading-tight">
                  Pembayaran awal ke creator (sekali saat publish)
                </p>
                <input
                  type="number"
                  min={0}
                  value={creatorApproveReward}
                  onChange={(e) => setCreatorApproveReward(Number(e.target.value))}
                  className="w-full text-base font-bold font-mono px-3.5 py-2.5 rounded-xl border-2 border-[#3F3766]/20 bg-white focus:outline-none focus:border-[#3F3766]"
                />
              </div>
            </div>

            {/* MAX MINT (IMAGE 1) */}
            <div className="p-4 rounded-2xl bg-white border-2 border-[#3F3766]/15 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-[#3F3766]">
                  Max Mint (Batas Kuota NFT) *
                </label>
                <span className="text-[11px] font-bold text-amber-700">
                  Semakin besar Max Mint, semakin besar kebutuhan deposit LITE.
                </span>
              </div>
              <input
                type="number"
                min={2}
                value={maxMint}
                onChange={(e) => setMaxMint(Number(e.target.value))}
                required
                className="w-full text-base font-bold font-mono px-4 py-3 rounded-xl border-2 border-[#3F3766]/20 bg-white focus:outline-none focus:border-[#3F3766] shadow-inner"
              />
              <p className="text-[10px] text-[#3F3766]/60">
                Batas maksimal total suplai NFT yang bisa dicetak (1 NFT pertama otomatis masuk ke dompet Creator).
              </p>
            </div>

            {/* MINTING FEE (IMAGE 1) */}
            <div className="p-5 rounded-2xl bg-[#F5E7C6]/30 border-2 border-[#3F3766]/15 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-[#3F3766] block">
                    Minting Fee
                  </span>
                  <span className="text-[11px] text-[#3F3766]/70">
                    Aktifkan biaya untuk pembaca (Gratis jika toggle dinonaktifkan)
                  </span>
                </div>

                {/* Toggle Switch */}
                <button
                  type="button"
                  onClick={() => setMintingFeeEnabled(!mintingFeeEnabled)}
                  className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-[#3F3766] transition-colors duration-200 ease-in-out focus:outline-none ${
                    mintingFeeEnabled ? "bg-[#F7ABC5]" : "bg-[#3F3766]/20"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white border border-[#3F3766] shadow-[0_2px_4px_rgba(0,0,0,0.2)] transition duration-200 ease-in-out mt-[2px] ml-[2px] ${
                      mintingFeeEnabled ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {mintingFeeEnabled && (
                <div className="pt-2">
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      min={0}
                      value={priceLite}
                      onChange={(e) => setPriceLite(Number(e.target.value))}
                      placeholder="0"
                      className="w-full text-base font-bold font-mono px-4 py-3 rounded-xl border-2 border-[#3F3766]/20 bg-white pr-16 focus:outline-none focus:border-[#3F3766]"
                    />
                    <span className="absolute right-4 font-mono font-black text-xs text-[#3F3766]/60">
                      LITE
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* KALKULASI DEPOSIT SMART CONTRACT & NON-REFUNDABLE CHECKBOX (IMAGE 1) */}
            <div className="rounded-2xl bg-[#3F3766] text-[#F5E7C6] p-5 space-y-3 shadow-md">
              <div className="flex items-center justify-between border-b border-white/15 pb-2.5">
                <span className="text-xs font-black uppercase tracking-wider text-[#F7ABC5]">
                  Kalkulasi Deposit Smart Contract
                </span>
                <span className="text-sm font-black font-mono">
                  {totalDeposit} LITE
                </span>
              </div>
              <p className="text-[11px] text-[#F5E7C6]/75 leading-relaxed">
                Total Kebutuhan Deposit = (User Reward × Max Mint) + (Creator Reward × Max Mint) + Creator Approve Reward.
              </p>

              <label className="flex items-start gap-3 pt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDepositConfirmed}
                  onChange={(e) => setIsDepositConfirmed(e.target.checked)}
                  className="h-4 w-4 mt-0.5 rounded border-white/30 text-[#F7ABC5] focus:ring-[#F7ABC5]"
                />
                <span className="text-xs font-bold leading-snug">
                  Konfirmasi Deposit Non-Refundable: Saya menyetujui bahwa sisa deposit reward LITE terkunci permanen di smart contract dan tidak dapat ditarik kembali.
                </span>
              </label>
            </div>

            {/* TOMBOL SIMPAN KONFIGURASI TOKENOMICS */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-4 rounded-2xl bg-[#F7ABC5] border-2 border-[#3F3766] text-sm font-black uppercase tracking-wider text-[#3F3766] shadow-[0_6px_0_0_#3F3766] hover:shadow-[0_2px_0_0_#3F3766] hover:translate-y-[4px] active:shadow-none transition-all disabled:opacity-50"
              >
                {isSaving ? "Menyimpan Konfigurasi..." : "Simpan Konfigurasi Tokenomics"}
              </button>
            </div>

          </div>

        </form>
      </main>
    </div>
  );
}
