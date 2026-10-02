"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  registerAdminNftArticle,
  getAdminCollections,
  createAdminCollection,
} from "@/app/actions/admin-nft";
import { LiteraCollection } from "@/lib/litera";
import { LiteraLoginModal } from "@/components/litera/LiteraLoginModal";

export function AdminLiteraClient() {
  // Collections State
  const [collections, setCollections] = useState<LiteraCollection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string>("Let Me Hear You - Jurnal & Refleksi");
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [newColName, setNewColName] = useState("");
  const [newColDesc, setNewColDesc] = useState("");

  // Section 1: Informasi Koleksi & Artikel
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [articleUrl, setArticleUrl] = useState("");
  const [creatorAddress, setCreatorAddress] = useState("");
  const [info, setInfo] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [description, setDescription] = useState("");

  // Section 2: Pengaturan Tokenomics & Deposit (Reward LITE) - [Image 1]
  const [userReward, setUserReward] = useState<number>(0);
  const [creatorReward, setCreatorReward] = useState<number>(0);
  const [creatorApproveReward, setCreatorApproveReward] = useState<number>(0);
  const [maxMint, setMaxMint] = useState<number>(100);
  const [isDepositConfirmed, setIsDepositConfirmed] = useState(false);

  // Section 3: Pengaturan Biaya & Media Asset (Upload Gambar / Video) - [Image 2]
  const [mintingFeeEnabled, setMintingFeeEnabled] = useState(false);
  const [priceLite, setPriceLite] = useState<number>(0);
  const [mediaType, setMediaType] = useState<"IMAGE" | "VIDEO">("IMAGE");
  const [mediaPreview, setMediaPreview] = useState<string>("/assets/sapiens.png");
  const [mediaFileName, setMediaFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Status & Auth Modal
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultMessage, setResultMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Load collections on mount
  useEffect(() => {
    getAdminCollections().then((cols) => {
      if (cols && cols.length > 0) {
        setCollections(cols);
        setSelectedCollection(cols[0].name);
      }
    });
  }, []);

  // Calculate Total Deposit LITE required
  const totalDeposit =
    (Number(userReward) || 0) * (Number(maxMint) || 0) +
    (Number(creatorReward) || 0) * (Number(maxMint) || 0) +
    (Number(creatorApproveReward) || 0);

  // Clean URL helper
  const cleanUrl = (url: string) => {
    return url.split("?")[0].split("#")[0];
  };

  const handleArticleUrlChange = (val: string) => {
    setArticleUrl(cleanUrl(val));
  };

  // Handle Media File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFileName(file.name);
      const objectUrl = URL.createObjectURL(file);
      setMediaPreview(objectUrl);
    }
  };

  // Handle Create New Collection
  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim()) return;

    const res = await createAdminCollection(newColName.trim(), newColDesc.trim());
    if (res) {
      setCollections((prev) => [...prev, res]);
      setSelectedCollection(res.name);
      setIsCreatingCollection(false);
      setNewColName("");
      setNewColDesc("");
    }
  };

  // Handle Submit Form to Register NFT
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResultMessage(null);

    if (!title.trim() || !author.trim() || !articleUrl.trim() || !creatorAddress.trim() || !description.trim()) {
      setResultMessage({
        type: "error",
        text: "Mohon lengkapi semua field bertanda wajib (Koleksi, Judul, Penulis, URL Artikel, Dompet Creator, dan Deskripsi).",
      });
      return;
    }

    if (totalDeposit > 0 && !isDepositConfirmed) {
      setResultMessage({
        type: "error",
        text: "Anda mengalokasikan deposit reward LITE. Wajib menyetujui konfirmasi Deposit Non-Refundable.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await registerAdminNftArticle({
        collectionName: selectedCollection,
        title,
        author,
        articleUrl,
        creatorAddress,
        info,
        externalUrl,
        description,
        userReward: Number(userReward) || 0,
        creatorReward: Number(creatorReward) || 0,
        creatorApproveReward: Number(creatorApproveReward) || 0,
        maxMint: Number(maxMint) || 100,
        isDepositConfirmed,
        mintingFeeEnabled,
        priceLite: mintingFeeEnabled ? Number(priceLite) || 0 : 0,
        mediaType,
        mediaUrl: mediaPreview,
      });

      if (res.success) {
        setResultMessage({
          type: "success",
          text: `${res.message} (Intent ID: ${res.intentId || "Tercatat di Jaringan"})`,
        });
      } else {
        setResultMessage({
          type: "error",
          text: res.message || "Gagal mendaftarkan artikel ke Litera NFT.",
        });
      }
    } catch (err) {
      setResultMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Terjadi kesalahan sistem saat mendaftar.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5E7C6] text-[#3F3766] flex flex-col font-sans">
      {/* 1. TOP HEADER NAVIGATION */}
      <header className="sticky top-0 z-30 border-b border-[#3F3766]/15 bg-[#F5E7C6]/90 backdrop-blur-md px-4 py-3.5 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
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
                  Portal Admin & Pengaturan Litera NFT
                </span>
                <span className="inline-flex items-center rounded-full bg-[#3F3766] px-2 py-0.5 text-[9px] font-bold text-[#F7ABC5]">
                  Creator Mode
                </span>
              </div>
              <p className="text-[11px] text-[#3F3766]/70">
                Pusat pendaftaran NFT & konfigurasi tokenomics artikel resmi penerbit
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/builder"
              className="hidden sm:inline-flex items-center rounded-xl bg-white/80 px-4 py-2 text-xs font-bold text-[#3F3766] border-2 border-[#3F3766]/20 hover:border-[#3F3766] transition shadow-sm"
            >
              Buka Studio Penulis
            </Link>
          </div>
        </div>
      </header>

      {/* 2. MAIN CONTAINER */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT FORM DOCK (COL-SPAN-7) */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* ALERT NOTIFICATION */}
            {resultMessage && (
              <div
                className={`rounded-2xl border-2 p-4 text-xs font-bold shadow-sm leading-relaxed ${
                  resultMessage.type === "success"
                    ? "border-emerald-600 bg-emerald-50 text-emerald-900"
                    : "border-red-500 bg-red-50 text-red-900"
                }`}
              >
                {resultMessage.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* BAGIAN 1: INFORMASI KOLEKSI & ARTIKEL */}
              <div className="rounded-3xl bg-white p-6 sm:p-8 border-2 border-[#3F3766]/15 shadow-[0_8px_0_0_#3F3766]/10 space-y-5">
                <div className="border-b border-[#3F3766]/10 pb-3 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-[#3F3766]">
                      1. Informasi Koleksi & Artikel
                    </span>
                    <p className="text-[11px] text-[#3F3766]/65 mt-0.5">
                      Metadata resmi artikel yang akan dicatat di smart contract dan open marketplace
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                    Wajib
                  </span>
                </div>

                {/* COLLECTION SELECT + CREATE BUTTON */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-[#3F3766]">
                      Collection (Koleksi Buku / NFT) *
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCreatingCollection(!isCreatingCollection)}
                      className="text-xs font-black text-[#3F3766] underline hover:text-[#3F3766]/70"
                    >
                      {isCreatingCollection ? "Batal" : "+ Create New Collection"}
                    </button>
                  </div>

                  {isCreatingCollection ? (
                    <div className="p-4 rounded-2xl bg-[#F5E7C6]/50 border-2 border-[#3F3766]/20 space-y-3">
                      <label className="block text-[11px] font-bold text-[#3F3766]">
                        Buat Koleksi Baru On-the-Fly
                      </label>
                      <input
                        type="text"
                        value={newColName}
                        onChange={(e) => setNewColName(e.target.value)}
                        placeholder="Nama Koleksi Baru (contoh: Jurnal Refleksi Jiwa)"
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border-2 border-[#3F3766]/20 bg-white focus:outline-none focus:border-[#3F3766]"
                      />
                      <input
                        type="text"
                        value={newColDesc}
                        onChange={(e) => setNewColDesc(e.target.value)}
                        placeholder="Deskripsi singkat koleksi..."
                        className="w-full text-xs px-3.5 py-2 rounded-xl border border-[#3F3766]/20 bg-white focus:outline-none focus:border-[#3F3766]"
                      />
                      <button
                        type="button"
                        onClick={handleCreateCollection}
                        className="px-4 py-2 rounded-xl bg-[#3F3766] text-white text-xs font-bold"
                      >
                        Simpan Koleksi
                      </button>
                    </div>
                  ) : (
                    <select
                      value={selectedCollection}
                      onChange={(e) => setSelectedCollection(e.target.value)}
                      required
                      className="w-full text-xs font-bold px-4 py-3 rounded-2xl border-2 border-[#3F3766]/15 bg-white text-[#3F3766] focus:outline-none focus:border-[#3F3766] shadow-inner"
                    >
                      {collections.map((col) => (
                        <option key={col.id} value={col.name}>
                          {col.name} {col.articleCount ? `(${col.articleCount} karya)` : ""}
                        </option>
                      ))}
                      <option value="Let Me Hear You - Jurnal & Refleksi">
                        Let Me Hear You - Jurnal & Refleksi (Default)
                      </option>
                      <option value="Ruang Pemulihan & Self-Care">Ruang Pemulihan & Self-Care</option>
                    </select>
                  )}
                </div>

                {/* NFT NAME (TITLE) */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-[#3F3766] mb-1.5">
                    NFT Name (Judul Artikel) *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Judul artikel atau karya yang akan dicetak sebagai NFT..."
                    required
                    className="w-full text-xs font-bold px-4 py-3 rounded-2xl border-2 border-[#3F3766]/15 bg-white placeholder:text-[#3F3766]/30 focus:outline-none focus:border-[#3F3766] focus:ring-4 focus:ring-[#F7ABC5]/30 shadow-inner"
                  />
                </div>

                {/* AUTHOR */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-[#3F3766] mb-1.5">
                    Author (Nama Penulis / Pemilik Karya Asli) *
                  </label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="Nama lengkap atau username penulis (@username)..."
                    required
                    className="w-full text-xs font-semibold px-4 py-2.5 rounded-2xl border-2 border-[#3F3766]/15 bg-white placeholder:text-[#3F3766]/30 focus:outline-none focus:border-[#3F3766]"
                  />
                </div>

                {/* ARTICLE LINK (AUTO-CLEANER) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-[#3F3766]">
                      Article Link (Tautan Permanen Artikel) *
                    </label>
                    <span className="text-[10px] text-[#3F3766]/60 font-mono">Auto-cleaner query/page active</span>
                  </div>
                  <input
                    type="url"
                    value={articleUrl}
                    onChange={(e) => handleArticleUrlChange(e.target.value)}
                    placeholder="https://subdomain.letmehearyou.id/judul-artikel"
                    required
                    className="w-full text-xs font-mono font-bold px-4 py-3 rounded-2xl border-2 border-[#3F3766]/15 bg-white placeholder:text-[#3F3766]/30 focus:outline-none focus:border-[#3F3766] shadow-inner"
                  />
                </div>

                {/* CREATOR ADDRESS (WALLET) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-[#3F3766]">
                      Creator Address (Alamat Dompet Web3 0x...) *
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsLoginModalOpen(true)}
                      className="text-xs font-black text-[#3F3766] underline hover:text-[#3F3766]/70"
                    >
                      Hubungkan Cloud Wallet
                    </button>
                  </div>
                  <input
                    type="text"
                    value={creatorAddress}
                    onChange={(e) => setCreatorAddress(e.target.value)}
                    placeholder="0x71C... (Alamat dompet penulis penerima royalti otomatis)"
                    required
                    className="w-full text-xs font-mono font-bold px-4 py-3 rounded-2xl border-2 border-[#3F3766]/15 bg-white placeholder:text-[#3F3766]/30 focus:outline-none focus:border-[#3F3766] shadow-inner"
                  />
                </div>

                {/* DESCRIPTION (SINOPSIS KARYA) */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-[#3F3766] mb-1.5">
                    Description (Sinopsis / Ringkasan Artikel) *
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ringkasan isi artikel yang tampil di metadata NFT dan OpenGraph sosial media..."
                    required
                    className="w-full text-xs font-medium p-4 rounded-2xl border-2 border-[#3F3766]/15 bg-white placeholder:text-[#3F3766]/30 leading-relaxed focus:outline-none focus:border-[#3F3766] shadow-inner"
                  />
                </div>

                {/* OPTIONAL FIELDS: INFO & EXTERNAL URL */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-[#3F3766] mb-1">
                      Info (Catatan Kurator - Opsional)
                    </label>
                    <textarea
                      rows={2}
                      value={info}
                      onChange={(e) => setInfo(e.target.value)}
                      placeholder="Informasi teknis tambahan terkait artikel..."
                      className="w-full text-xs p-3 rounded-xl border border-[#3F3766]/20 bg-white focus:outline-none focus:border-[#3F3766]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#3F3766] mb-1">
                      External URL (Tautan Promosi / CTA - Opsional)
                    </label>
                    <input
                      type="url"
                      value={externalUrl}
                      onChange={(e) => setExternalUrl(e.target.value)}
                      placeholder="https://event.letmehearyou.id"
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#3F3766]/20 bg-white focus:outline-none focus:border-[#3F3766]"
                    />
                  </div>
                </div>
              </div>

              {/* BAGIAN 2: PENGATURAN TOKENOMICS & DEPOSIT (REWARD LITE) - SESUAI GAMBAR 1 */}
              <div className="rounded-3xl bg-white p-6 sm:p-8 border-2 border-[#3F3766]/15 shadow-[0_8px_0_0_#3F3766]/10 space-y-6">
                <div className="border-b border-[#3F3766]/10 pb-3 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-[#3F3766]">
                      2. Pengaturan Tokenomics & Deposit (Reward LITE)
                    </span>
                    <p className="text-[11px] text-[#3F3766]/65 mt-0.5">
                      Struktur insentif pembaca, royalti kreator, dan alokasi deposit smart contract
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-[#3F3766] bg-[#F7ABC5] px-2.5 py-0.5 rounded-full border border-[#3F3766]/20">
                    Admin Managed
                  </span>
                </div>

                {/* 3-COLUMN INPUT GRID (MATCHING IMAGE 1 EXACTLY) */}
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

                {/* MAX MINT (MATCHING IMAGE 1) */}
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

                {/* REALTIME TOTAL DEPOSIT LITE REQUIREMENT & NON-REFUNDABLE CHECKBOX */}
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
              </div>

              {/* BAGIAN 3: PENGATURAN BIAYA & MEDIA ASSET (IMAGE / VIDEO UPLOAD) */}
              <div className="rounded-3xl bg-white p-6 sm:p-8 border-2 border-[#3F3766]/15 shadow-[0_8px_0_0_#3F3766]/10 space-y-6">
                <div className="border-b border-[#3F3766]/10 pb-3 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-[#3F3766]">
                      3. Pengaturan Biaya & Media Asset
                    </span>
                    <p className="text-[11px] text-[#3F3766]/65 mt-0.5">
                      Biaya pembaca dan visual asset yang akan diunggah ke IPFS
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                    Wajib Media
                  </span>
                </div>

                {/* MINTING FEE (TOGGLE & NUMBER LITE) - MATCHING IMAGE 1 */}
                <div className="rounded-2xl bg-[#F5E7C6]/30 p-5 border-2 border-[#3F3766]/15 space-y-3">
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

                {/* MEDIA TYPE & UPLOAD (IMAGE / VIDEO SWITCHER) */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase tracking-wider text-[#3F3766]">
                      Media Type & Upload *
                    </label>
                    <div className="flex rounded-xl bg-[#3F3766]/10 p-1">
                      <button
                        type="button"
                        onClick={() => setMediaType("IMAGE")}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                          mediaType === "IMAGE" ? "bg-[#3F3766] text-white shadow" : "text-[#3F3766]/70"
                        }`}
                      >
                        Gambar (JPG/PNG/WEBP)
                      </button>
                      <button
                        type="button"
                        onClick={() => setMediaType("VIDEO")}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                          mediaType === "VIDEO" ? "bg-[#3F3766] text-white shadow" : "text-[#3F3766]/70"
                        }`}
                      >
                        Video (MP4)
                      </button>
                    </div>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={mediaType === "IMAGE" ? "image/png,image/jpeg,image/webp" : "video/mp4"}
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {/* DROPZONE / FILE PICKER */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-3xl border-2 border-dashed border-[#3F3766]/40 bg-[#F5E7C6]/20 hover:bg-[#F5E7C6]/40 p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2"
                  >
                    <div className="h-12 w-12 rounded-2xl bg-[#3F3766] text-[#F7ABC5] flex items-center justify-center font-bold text-lg shadow-sm">
                      ↑
                    </div>
                    <p className="text-xs font-black text-[#3F3766]">
                      Klik untuk Mengunggah {mediaType === "IMAGE" ? "Gambar Cover" : "Video MP4"}
                    </p>
                    <p className="text-[10px] text-[#3F3766]/60">
                      {mediaFileName || (mediaType === "IMAGE" ? "Maksimal 10MB (JPG, PNG, WEBP)" : "Maksimal 50MB (MP4)")}
                    </p>
                  </div>
                </div>

                {/* ACTION BUTTON: PREPARE & UPLOAD TO IPFS */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-2xl bg-[#F7ABC5] border-2 border-[#3F3766] text-sm font-black uppercase tracking-wider text-[#3F3766] shadow-[0_6px_0_0_#3F3766] hover:shadow-[0_2px_0_0_#3F3766] hover:translate-y-[4px] active:shadow-none transition-all disabled:opacity-50"
                >
                  {isSubmitting ? "Mengunggah ke IPFS & Blockchain..." : "Prepare & Upload to Litera NFT"}
                </button>
              </div>

            </form>
          </div>

          {/* RIGHT LIVE PREVIEW DRAWER (COL-SPAN-5) */}
          <div className="lg:col-span-5 sticky top-24 space-y-4">
            <div className="rounded-3xl bg-white p-5 border-2 border-[#3F3766]/15 shadow-[0_6px_0_0_#3F3766]/10">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#3F3766] block mb-3">
                Live Preview Kartu NFT Blockchain
              </span>

              {/* LITERA OFFICIAL CARD PREVIEW (IMAGE 2 REPLICA) */}
              <div className="rounded-3xl bg-[#171d2a] p-6 text-center border border-white/10 shadow-[0_16px_40px_rgba(0,0,0,0.5)] flex flex-col items-center relative overflow-hidden">
                <div className="absolute -top-12 -left-12 w-48 h-48 bg-[#d97746]/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-[#3F3766]/40 rounded-full blur-3xl pointer-events-none" />

                {/* Artwork Media Box */}
                <div className="relative w-44 h-44 rounded-2xl overflow-hidden border border-white/15 shadow-2xl bg-[#c5baa7] flex items-center justify-center">
                  {mediaType === "IMAGE" ? (
                    <Image
                      src={mediaPreview}
                      alt="Artwork Preview"
                      width={170}
                      height={170}
                      className="object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.3)] opacity-95"
                    />
                  ) : (
                    <video src={mediaPreview} controls className="w-full h-full object-cover" />
                  )}

                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-md px-2 py-0.5 border border-white/20">
                    <span className="h-2 w-2 rounded-full bg-[#f27438] animate-pulse"></span>
                    <span className="text-[9px] font-bold text-white tracking-wide">
                      Let Me Hear You
                    </span>
                  </div>
                </div>

                {/* Collection Pill */}
                <div className="mt-4 mb-2 inline-flex items-center gap-1.5 rounded-full bg-[#351918] border border-[#d97746]/40 px-3 py-1 text-[9px] font-black text-[#f08554] uppercase tracking-wider">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#f08554]"></span>
                  <span className="truncate max-w-[200px]">{selectedCollection}</span>
                </div>

                {/* Title */}
                <h3 className="text-base font-black !text-white leading-snug tracking-tight max-w-xs mt-1 truncate w-full">
                  {title || "Judul NFT Artikel"}
                </h3>

                {/* Author & Subtitle */}
                <p className="text-[11px] text-white/60 mt-1">
                  Karya oleh <strong className="text-white">@{author || "penulis"}</strong>
                </p>
                <p className="text-[10px] text-slate-300 mt-1.5 line-clamp-2 max-w-xs">
                  {description || "Diterbitkan resmi sebagai aset digital permanen artikel ini."}
                </p>

                {/* CTA Button */}
                <button
                  type="button"
                  className="w-full max-w-xs mt-5 py-2.5 px-5 rounded-2xl bg-gradient-to-r from-[#cf6e3e] to-[#b8582d] text-white text-xs font-black tracking-wide shadow-[0_4px_16px_rgba(207,110,62,0.4)] border border-[#f08554]/30"
                >
                  {mintingFeeEnabled && priceLite > 0 ? `Beli NFT (${priceLite} LITE)` : "Miliki Edisi Digital (Gratis)"}
                </button>

                {/* Footer Info */}
                <div className="mt-4 flex items-center justify-between w-full text-[9px] text-slate-400 border-t border-white/10 pt-3">
                  <span>Suplai: {maxMint} Edisi</span>
                  <span>Cashback: {userReward} LITE</span>
                </div>
              </div>

              {/* Status Summary */}
              <div className="mt-4 rounded-2xl bg-[#F5E7C6]/50 p-4 border border-[#3F3766]/15 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="font-bold text-[#3F3766]/70">Alamat Dompet Creator:</span>
                  <span className="font-mono font-bold text-[#3F3766] truncate max-w-[150px]">
                    {creatorAddress || "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-[#3F3766]/70">Biaya Minting:</span>
                  <span className="font-mono font-bold text-[#3F3766]">
                    {mintingFeeEnabled ? `${priceLite} LITE` : "0 LITE (Gratis)"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-[#3F3766]/70">Total Deposit LITE:</span>
                  <span className="font-mono font-bold text-amber-800">
                    {totalDeposit} LITE
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* POPUP LOGIN MODAL */}
      <LiteraLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={(wallet) => setCreatorAddress(wallet)}
      />
    </div>
  );
}
