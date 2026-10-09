"use client";

import { useState } from "react";
import Link from "next/link";
import { getBuilderUrl } from "@/lib/builder";
import type { Article, Profile } from "@/lib/supabase/types";
import { deleteTenantArticle } from "@/app/actions/tenant";

interface ProfileTabsProps {
  articles: Article[];
  profile: Profile;
  username: string;
  isOwnProfile?: boolean;
}

type TabType = "articles" | "nft" | "about";

export function ProfileTabs({
  articles,
  profile,
  username,
  isOwnProfile = false,
}: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>("articles");
  const [articleList, setArticleList] = useState<Article[]>(articles);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (articleId: string, articleTitle: string) => {
    const confirmDelete = window.confirm(`Hapus tulisan "${articleTitle}"? Tindakan ini tidak dapat dibatalkan.`);
    if (!confirmDelete) return;

    setDeletingId(articleId);
    try {
      const res = await deleteTenantArticle(articleId, username);
      if (res.success) {
        setArticleList((prev) => prev.filter((a) => a.id !== articleId));
      } else {
        alert(res.error || "Gagal menghapus tulisan.");
      }
    } catch (err: unknown) {
      console.error("[ProfileTabs] Error deleting article:", err);
      alert("Terjadi kesalahan saat menghapus tulisan.");
    } finally {
      setDeletingId(null);
    }
  };

  const displayName = profile.display_name || profile.username;
  const literaArticles = articleList.filter((a) => Boolean(a.register_litera));

  return (
    <div className="mt-10">
      {/* Tabs Navigation Header */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-4 sm:space-x-8 overflow-x-auto no-scrollbar py-1" aria-label="Tabs Profil">
          <button
            onClick={() => setActiveTab("articles")}
            className={`relative pb-3 text-xs sm:text-sm font-semibold transition whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === "articles"
                ? "text-[#3F3766]"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>Refleksi & Tulisan</span>
            <span className="ml-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
              {articleList.length}
            </span>
            {activeTab === "articles" && (
              <span className="absolute bottom-0 left-0 h-0.5 w-full bg-[#F7ABC5] rounded-t-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("nft")}
            className={`relative pb-3 text-xs sm:text-sm font-semibold transition whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === "nft"
                ? "text-[#3F3766]"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <span>Sertifikat Digital Litera NFT</span>
              <span className="rounded-full bg-purple-100 px-1.5 py-0.5 text-[10px] font-bold text-purple-700">
                Web3
              </span>
            </span>
            {activeTab === "nft" && (
              <span className="absolute bottom-0 left-0 h-0.5 w-full bg-[#F7ABC5] rounded-t-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("about")}
            className={`relative pb-3 text-xs sm:text-sm font-semibold transition whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === "about"
                ? "text-[#3F3766]"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>Tentang Penulis</span>
            {activeTab === "about" && (
              <span className="absolute bottom-0 left-0 h-0.5 w-full bg-[#F7ABC5] rounded-t-full" />
            )}
          </button>
        </nav>
      </div>

      {/* Tab 1: Refleksi & Tulisan */}
      {activeTab === "articles" && (
        <div className="mt-8 space-y-6">
          {articleList.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white/50 p-12 text-center">
              <h3 className="text-lg font-bold text-slate-800">
                Belum ada refleksi yang diterbitkan
              </h3>
              <p className="mt-1.5 text-sm text-slate-500">
                @{username} belum membagikan tulisan jurnal di ruang ini.
              </p>
              {isOwnProfile && (
                <div className="mt-6">
                  <Link
                    href={getBuilderUrl(username)}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#F7ABC5] px-5 py-2.5 text-sm font-semibold text-[#3F3766] shadow-[0_3px_0_0_#3F3766] transition hover:bg-[#F5E7C6] hover:shadow-[0_2px_0_0_#3F3766] hover:translate-y-[1px] active:shadow-none active:translate-y-[3px]"
                  >
                    <span>Mulai Tulis Sekarang</span>
                    <span>→</span>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            articleList.map((art) => {
              const readTime = Math.max(
                1,
                Math.ceil((art.content || "").split(/\s+/).filter(Boolean).length / 180)
              );
              return (
                <article
                  key={art.id}
                  className="group relative flex flex-col justify-between gap-6 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm transition hover:border-[#F7ABC5] hover:shadow-md sm:flex-row sm:items-center"
                >
                  <div className="flex-1">
                    {/* Tags & Badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      {(art.tags || ["Refleksi"]).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600"
                        >
                          #{tag}
                        </span>
                      ))}
                      {art.register_litera && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-700 border border-purple-200/60">
                          <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-pulse" />
                          Litera NFT
                        </span>
                      )}
                    </div>

                    {/* Article Title */}
                    <h3 className="mt-3 text-xl font-bold tracking-tight text-slate-900 group-hover:text-[#3F3766] transition sm:text-2xl">
                      <Link href={`/${art.slug}`}>
                        {art.title}
                      </Link>
                    </h3>

                    {/* Excerpt */}
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-600 sm:text-base">
                      {art.excerpt || art.content.slice(0, 150) + "..."}
                    </p>

                    {/* Meta Footer */}
                    <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-400">
                      <span>
                        {new Date(art.published_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                      <span>•</span>
                      <span>{readTime} menit baca</span>
                      <span>•</span>
                      <Link
                        href={`/${art.slug}`}
                        className="font-bold text-[#3F3766] transition hover:text-[#3F3766] hover:underline"
                      >
                        Baca selengkapnya →
                      </Link>

                      {isOwnProfile && (
                        <>
                          <span>•</span>
                          <button
                            type="button"
                            onClick={() => handleDelete(art.id, art.title)}
                            disabled={deletingId === art.id}
                            className="font-medium text-rose-500 hover:text-rose-700 hover:underline transition cursor-pointer disabled:opacity-50"
                          >
                            {deletingId === art.id ? "Menghapus..." : "Hapus"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Thumbnail Cover (if exists) */}
                  {art.media_url && !art.media_url.startsWith("blob:") && (
                    <div className="relative h-28 w-full sm:h-28 sm:w-36 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={art.media_url}
                        alt={art.title}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        onError={(e) => {
                          const parent = (e.currentTarget as HTMLElement).parentElement;
                          if (parent) parent.style.display = "none";
                        }}
                      />
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>
      )}

      {/* Tab 2: Sertifikat Digital Litera NFT */}
      {activeTab === "nft" && (
        <div className="mt-8 space-y-6">
          {/* Litera Web3 Network Info Banner */}
          <div className="rounded-2xl border border-purple-200 bg-gradient-to-r from-purple-50/70 via-fuchsia-50/40 to-amber-50/50 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-900">
                    Protokol Kontrak Pintar Polygon Mainnet (Chain ID 137)
                  </span>
                </div>
                <h4 className="mt-1.5 text-lg font-bold text-slate-900">
                  Koleksi Sertifikat Digital Resmi Litera
                </h4>
                <p className="mt-1 max-w-2xl text-xs text-slate-600 leading-relaxed sm:text-sm">
                  Setiap artikel bersertifikat di bawah ini terdaftar secara permanen di blockchain Polygon. Pembaca dapat mengoleksi NFT, mendukung kreator secara langsung, serta membuka konten eksklusif (unlockable content).
                </p>
              </div>
              <div className="shrink-0">
                <span className="inline-block rounded-xl border border-purple-300 bg-white px-3.5 py-1.5 text-xs font-bold text-purple-800 shadow-sm">
                  {literaArticles.length} Edisi NFT Terbit
                </span>
              </div>
            </div>
          </div>

          {literaArticles.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white/50 p-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-100 text-3xl">
                💎
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-800">
                Belum ada artikel bersertifikat Litera NFT
              </h3>
              <p className="mt-1.5 text-sm text-slate-500 max-w-md mx-auto">
                Kreator dapat mengaktifkan registrasi Litera Web3 saat menerbitkan tulisan dari Web Builder untuk menerbitkan sertifikat digital Polygon.
              </p>
              {isOwnProfile && (
                <div className="mt-6">
                  <Link
                    href={getBuilderUrl(username)}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#F7ABC5] px-5 py-2.5 text-sm font-semibold text-[#3F3766] shadow-[0_3px_0_0_#3F3766] transition hover:bg-[#F5E7C6] hover:shadow-[0_2px_0_0_#3F3766] hover:translate-y-[1px] active:shadow-none active:translate-y-[3px]"
                  >
                    <span>Terbitkan Artikel NFT</span>
                    <span>→</span>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {literaArticles.map((art) => (
                <div
                  key={art.id}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-purple-200/80 bg-white p-6 shadow-sm transition hover:border-[#F7ABC5] hover:shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1.5 font-bold text-purple-700">
                        <span className="h-2 w-2 rounded-full bg-purple-600 animate-pulse" />
                        Polygon ERC-1155
                      </span>
                      <span className="rounded-md bg-purple-50 px-2 py-0.5 font-semibold text-purple-800">
                        Verified Protocol
                      </span>
                    </div>

                    <h4 className="mt-3 text-lg font-bold text-slate-900 group-hover:text-[#3F3766] transition">
                      <Link href={`/${art.slug}`}>
                        {art.title}
                      </Link>
                    </h4>

                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-600 sm:text-sm">
                      {art.excerpt}
                    </p>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-xs">
                    <span className="text-slate-400">
                      Penulis: @{username}
                    </span>
                    <Link
                      href={`/${art.slug}`}
                      className="font-bold text-[#3F3766] transition hover:text-[#3F3766] hover:underline"
                    >
                      Koleksi & Buka Akses →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Tentang Penulis */}
      {activeTab === "about" && (
        <div className="mt-8 space-y-6">
          <div className="rounded-3xl border border-slate-200/90 bg-white p-8 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900">
              Tentang {displayName}
            </h3>

            <div className="mt-4 prose prose-slate text-base leading-relaxed text-slate-700">
              <p>
                {profile.bio ||
                  `Selamat datang di ruang refleksi digital @${username}. Tempat di mana pemikiran, pengalaman batin, dan eksplorasi kesehatan mental dirangkum dalam tulisan yang mendalam.`}
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 border-t border-slate-100 pt-6 sm:grid-cols-2">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Subdomain Publikasi
                </h4>
                <p className="mt-1 text-sm font-semibold text-slate-800">
                  https://{username}.letmehearyou.id
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Bergabung Sejak
                </h4>
                <p className="mt-1 text-sm font-semibold text-slate-800">
                  {profile.created_at
                    ? new Date(profile.created_at).toLocaleDateString("id-ID", {
                        month: "long",
                        year: "numeric",
                      })
                    : "Oktober 2026"}
                </p>
              </div>

              {profile.website && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Situs Web / Portofolio
                  </h4>
                  <a
                    href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-[#3F3766] hover:underline"
                  >
                    <span>{profile.website}</span>
                    <span>↗</span>
                  </a>
                </div>
              )}

              {profile.facebook_profile_url && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Facebook Profil
                  </h4>
                  <a
                    href={profile.facebook_profile_url.startsWith("http") ? profile.facebook_profile_url : `https://${profile.facebook_profile_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-[#3F3766] hover:underline"
                  >
                    <span>{profile.facebook_profile_url}</span>
                    <span>↗</span>
                  </a>
                </div>
              )}
            </div>

            {/* Misi & Ruang Aman */}
            <div className="mt-8 rounded-2xl bg-[#fbf8f5] p-6 border border-[#3F3766]/10">
              <h4 className="text-sm font-bold text-slate-800">
                🌿 Misi & Ruang Aman Menulis
              </h4>
              <p className="mt-1.5 text-xs text-slate-600 leading-relaxed sm:text-sm">
                Setiap karya di subdomain ini diterbitkan dengan niat keterbukaan rasa, ketenangan pikiran, dan ruang dialog yang aman. Didukung oleh integrasi Web3 Litera untuk memberikan kedaulatan penuh bagi pembaca dan penulis.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
