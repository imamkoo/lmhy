"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import type { Article } from "@/lib/article-storage";
import type { User } from "@supabase/supabase-js";

interface ProfileItem {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio?: string | null;
  creator_role?: string | null;
}

interface ArticlesPortalClientProps {
  articles: Article[];
  authors: ProfileItem[];
  initialUser: User | null;
  initialProfile: { username: string | null; display_name: string | null } | null;
}

const CATEGORY_PILLS = [
  { id: "ALL", label: "Semua Topik", icon: "✨" },
  { id: "Kesehatan Mental", label: "Kesehatan Mental", icon: "🌿" },
  { id: "Refleksi Diri", label: "Refleksi Diri", icon: "🕊️" },
  { id: "Burnout & Kerja", label: "Burnout & Kerja", icon: "⏳" },
  { id: "Hubungan & Jiwa", label: "Hubungan & Jiwa", icon: "🤍" },
  { id: "Resiliensi", label: "Resiliensi", icon: "🌱" },
];

export function ArticlesPortalClient({
  articles,
  authors,
  initialUser,
  initialProfile,
}: ArticlesPortalClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Subtle initial reveal
    const timer = setTimeout(() => setIsLoading(false), 200);
    return () => clearTimeout(timer);
  }, []);

  // Filtered articles
  const filteredArticles = useMemo(() => {
    return articles.filter((art) => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        art.title.toLowerCase().includes(q) ||
        (art.excerpt && art.excerpt.toLowerCase().includes(q)) ||
        art.username.toLowerCase().includes(q);

      const matchCategory =
        selectedCategory === "ALL" ||
        (art.tags && art.tags.some((t) => t.toLowerCase().includes(selectedCategory.toLowerCase()))) ||
        art.title.toLowerCase().includes(selectedCategory.toLowerCase());

      return matchQuery && matchCategory;
    });
  }, [articles, searchQuery, selectedCategory]);

  const featuredArticle = filteredArticles[0] || articles[0];
  const secondaryFeatured = filteredArticles.slice(1, 4);
  const remainingArticles = filteredArticles.slice(4);

  const resolveArticleHref = (art: Article) => {
    return `/tenant/${art.username}/${art.slug}`;
  };

  const resolveAuthorHref = (username: string) => {
    return `/tenant/${username}`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Baru saja";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "Hari ini";
    }
  };

  return (
    <div className="min-h-screen bg-[#fbf8f5] dark:bg-[#120f1d] text-slate-800 dark:text-slate-100 selection:bg-[#c4b5fd] selection:text-slate-900 transition-colors">
      {/* Background ambient glowing spheres */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[hsl(257,68%,73%)]/15 blur-3xl" />
        <div className="absolute top-1/3 -right-32 w-[30rem] h-[30rem] rounded-full bg-[hsl(42,73%,74%)]/20 blur-3xl" />
        <div className="absolute -bottom-32 left-1/4 w-[28rem] h-[28rem] rounded-full bg-[hsl(344,81%,87%)]/15 blur-3xl" />
      </div>

      {/* Top Newsroom Navbar */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/70 dark:bg-slate-950/70 border-b border-black/[0.06] dark:border-white/[0.08] transition-all">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-4">
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-6 shrink-0">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[hsl(257,68%,73%)] to-[hsl(42,73%,74%)] p-0.5 shadow-md shadow-purple-500/10 group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[14px] flex items-center justify-center font-bold text-lg text-[#3c3163] dark:text-purple-300">
                  LH
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900 dark:text-white">
                  Let Me Hear You
                </span>
                <span className="text-[10px] font-semibold tracking-widest uppercase text-purple-700 dark:text-purple-400">
                  Warta & Publikasi Komunitas
                </span>
              </div>
            </Link>
          </div>

          {/* Central Live Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <span className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari esai, refleksi, atau topik kesehatan mental..."
                className="w-full pl-10 pr-4 py-2.5 rounded-full text-sm bg-slate-100/80 dark:bg-white/[0.06] border border-transparent focus:border-[hsl(257,68%,73%)] focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[hsl(257,68%,73%)]/20 transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-3 flex items-center text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* CTA & Author Action */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/builder"
              className="relative group overflow-hidden rounded-full p-[1px] font-semibold text-xs sm:text-sm shadow-sm"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-[hsl(257,68%,73%)] to-[hsl(344,81%,87%)] rounded-full transition-all group-hover:opacity-90" />
              <span className="relative flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white group-hover:bg-opacity-90 transition-colors">
                <span className="text-base">✍️</span>
                <span>Tulis Karya</span>
              </span>
            </Link>

            {initialUser && initialProfile?.username ? (
              <Link
                href={`/tenant/${initialProfile.username}`}
                className="w-9 h-9 rounded-full bg-[hsl(257,68%,73%)]/20 text-[hsl(257,68%,60%)] flex items-center justify-center font-bold text-xs hover:ring-2 hover:ring-[hsl(257,68%,73%)] transition-all"
                title={`Profil @${initialProfile.username}`}
              >
                {initialProfile.username.slice(0, 2).toUpperCase()}
              </Link>
            ) : (
              <Link
                href="/login"
                className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-2 py-1"
              >
                Masuk
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Search Input */}
        <div className="md:hidden px-4 pb-3">
          <div className="relative w-full">
            <span className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari karya atau topik..."
              className="w-full pl-10 pr-4 py-2 rounded-full text-xs bg-slate-100 dark:bg-white/[0.06] border border-transparent focus:border-[hsl(257,68%,73%)] focus:outline-none"
            />
          </div>
        </div>

        {/* Category Filter Pills (Horizontal Scroll) */}
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar border-t border-black/[0.03] dark:border-white/[0.04]">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 shrink-0 mr-1">
            Kategori:
          </span>
          {CATEGORY_PILLS.map((cat) => {
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 shrink-0 ${
                  active
                    ? "bg-[#3c3163] text-white shadow-sm shadow-purple-900/20"
                    : "bg-white/80 dark:bg-white/[0.05] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200/60 dark:border-white/5"
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-[1240px] mx-auto px-4 sm:px-6 py-8 relative z-10">
        {/* Loading Skeleton */}
        {isLoading ? (
          <div className="space-y-8 animate-pulse">
            <div className="h-[460px] rounded-3xl bg-slate-200 dark:bg-slate-800/50" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-72 rounded-2xl bg-slate-200 dark:bg-slate-800/50" />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* HERO FEATURED STORY (Editorial Headline Card) */}
            {featuredArticle && (
              <motion.section
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="mb-14"
              >
                <div className="group relative w-full h-[460px] sm:h-[520px] rounded-3xl overflow-hidden shadow-2xl shadow-purple-950/10 border border-black/5 dark:border-white/10">
                  {/* Background Image / Cover */}
                  <Image
                    src={featuredArticle.media_url || "/assets/lmhy-cover.jpg"}
                    alt={featuredArticle.title}
                    fill
                    priority
                    sizes="(max-width: 1240px) 100vw, 1240px"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  {/* Subtle 3D Glass Vignette Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/50 to-transparent" />

                  {/* Top Floating Badges */}
                  <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-10">
                    <div className="flex items-center gap-2">
                      <span className="px-3.5 py-1.5 rounded-full bg-[hsl(257,68%,73%)] text-slate-950 font-extrabold text-xs tracking-wider uppercase shadow-lg">
                        ⭐ Sorotan Utama
                      </span>
                      {featuredArticle.litera_status === "MINTED" && (
                        <span className="px-3 py-1 rounded-full bg-emerald-500/90 text-white font-bold text-[11px] backdrop-blur-md flex items-center gap-1 shadow-sm">
                          <span>⛓️</span> Terverifikasi Litera
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-medium text-white/80 bg-black/40 px-3 py-1 rounded-full backdrop-blur-md">
                      {formatDate(featuredArticle.published_at)}
                    </span>
                  </div>

                  {/* Card Content & Title */}
                  <div className="absolute bottom-0 inset-x-0 p-6 sm:p-10 z-10 max-w-4xl flex flex-col gap-3">
                    <Link
                      href={resolveArticleHref(featuredArticle)}
                      className="group-hover:text-purple-200 transition-colors"
                    >
                      <h1 className="font-extrabold text-2xl sm:text-4xl lg:text-5xl text-white tracking-tight leading-tight line-clamp-2 drop-shadow-md">
                        {featuredArticle.title}
                      </h1>
                    </Link>

                    {featuredArticle.excerpt && (
                      <p className="text-sm sm:text-base text-slate-200 line-clamp-2 font-light leading-relaxed max-w-3xl drop-shadow">
                        {featuredArticle.excerpt}
                      </p>
                    )}

                    {/* Author Meta Row */}
                    <div className="flex items-center gap-4 pt-2">
                      <Link
                        href={resolveAuthorHref(featuredArticle.username)}
                        className="flex items-center gap-2.5 group/author"
                      >
                        <div className="w-10 h-10 rounded-full bg-white/20 ring-2 ring-white/50 overflow-hidden flex items-center justify-center font-bold text-white text-sm backdrop-blur-md">
                          {featuredArticle.username.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-white font-semibold text-sm group-hover/author:underline">
                            @{featuredArticle.username}
                          </span>
                          <span className="text-xs text-slate-300">Penulis Kontributor</span>
                        </div>
                      </Link>

                      <div className="h-6 border-r border-white/20" />

                      <Link
                        href={resolveArticleHref(featuredArticle)}
                        className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[hsl(42,73%,74%)] hover:text-white transition-colors ml-auto"
                      >
                        <span>Baca Selengkapnya</span>
                        <span>→</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.section>
            )}

            {/* SECONDARY ROW (Up to date News / Editorial 3-Cards) */}
            {secondaryFeatured.length > 0 && (
              <section className="mb-14">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                      Rilisan Terkini Komunitas
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                      Gagasan, pengalaman, dan panduan terbaru dari penulis terpercaya.
                    </p>
                  </div>
                  <span className="hidden sm:inline-block px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                    Up To Date
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {secondaryFeatured.map((art, idx) => (
                    <motion.div
                      key={art.id || `${art.username}-${art.slug}-${idx}`}
                      whileHover={{ y: -6 }}
                      transition={{ duration: 0.2 }}
                      className="group flex flex-col bg-white dark:bg-slate-900/70 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-white/[0.08] shadow-sm hover:shadow-xl hover:shadow-purple-950/5 transition-all"
                    >
                      <Link href={resolveArticleHref(art)} className="relative h-48 w-full overflow-hidden block">
                        <Image
                          src={art.media_url || "/assets/lmhy-cover.jpg"}
                          alt={art.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-3 left-3 flex gap-1.5">
                          {art.tags?.[0] && (
                            <span className="px-2.5 py-1 rounded-full bg-white/95 dark:bg-slate-900/90 text-slate-800 dark:text-white font-bold text-[10px] uppercase shadow-sm">
                              {art.tags[0]}
                            </span>
                          )}
                        </div>
                      </Link>

                      <div className="p-5 flex-1 flex flex-col justify-between gap-3">
                        <div className="space-y-1.5">
                          <span className="text-[11px] font-medium text-slate-400">
                            {formatDate(art.published_at)}
                          </span>
                          <Link href={resolveArticleHref(art)}>
                            <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors leading-snug">
                              {art.title}
                            </h3>
                          </Link>
                          {art.excerpt && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                              {art.excerpt}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/[0.05] text-xs">
                          <Link
                            href={resolveAuthorHref(art.username)}
                            className="text-slate-600 dark:text-slate-300 font-medium hover:underline flex items-center gap-1.5"
                          >
                            <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-[10px]">
                              {art.username.charAt(0).toUpperCase()}
                            </span>
                            <span>@{art.username}</span>
                          </Link>

                          <Link
                            href={resolveArticleHref(art)}
                            className="font-semibold text-purple-700 dark:text-purple-400 hover:text-purple-900"
                          >
                            Baca →
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* AUTHOR SHOWCASE SECTION (Best Authors / Contributors) */}
            {authors.length > 0 && (
              <section className="mb-14 p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-purple-50/60 to-transparent dark:from-slate-900/40 dark:to-transparent border border-purple-100 dark:border-white/5">
                <div className="text-center max-w-xl mx-auto mb-8 space-y-2">
                  <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-widest bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300">
                    KONTRIBUTOR TERPILIH
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    Jelajahi Profil & Pemikiran Penulis
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    Temukan ruang refleksi dan jadwal Sesi Dengar bersama para pendamping dan praktisi.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                  {authors.map((auth) => (
                    <Link
                      key={auth.username}
                      href={resolveAuthorHref(auth.username)}
                      className="group p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/70 dark:border-white/5 flex flex-col items-center text-center gap-3 hover:ring-2 hover:ring-[hsl(257,68%,73%)] hover:shadow-lg transition-all"
                    >
                      <div className="w-14 h-14 rounded-full overflow-hidden bg-purple-100 dark:bg-slate-800 flex items-center justify-center font-bold text-purple-700 dark:text-purple-300 text-base ring-2 ring-purple-200/50 group-hover:scale-105 transition-transform">
                        {auth.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={auth.avatar_url} alt={auth.username} className="w-full h-full object-cover" />
                        ) : (
                          auth.username.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div className="space-y-0.5">
                        <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate max-w-[110px]">
                          {auth.display_name || `@${auth.username}`}
                        </p>
                        <p className="text-[10px] text-purple-600 dark:text-purple-400 uppercase tracking-wider font-semibold">
                          {auth.creator_role || "Kontributor"}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* REMAINING ARTICLES & EDITORIAL FEED */}
            {remainingArticles.length > 0 ? (
              <section className="mb-14">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                      Arsip Esai & Catatan Suara Jiwa
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                      Seluruh bacaan terbuka yang ditulis untuk menemani perjalanan mental Anda.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {remainingArticles.map((art, idx) => (
                    <div
                      key={art.id || `${art.username}-${art.slug}-${idx}`}
                      className="flex flex-col bg-white dark:bg-slate-900/60 rounded-2xl overflow-hidden border border-slate-200/60 dark:border-white/[0.06] hover:border-purple-300 dark:hover:border-purple-500/30 transition-all p-4 gap-3.5 group"
                    >
                      <div className="relative h-44 w-full rounded-xl overflow-hidden">
                        <Image
                          src={art.media_url || "/assets/lmhy-cover.jpg"}
                          alt={art.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="space-y-1.5 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                            <span>@{art.username}</span>
                            <span>{formatDate(art.published_at)}</span>
                          </div>
                          <Link href={resolveArticleHref(art)}>
                            <h3 className="font-bold text-base text-slate-900 dark:text-white line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                              {art.title}
                            </h3>
                          </Link>
                          {art.excerpt && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                              {art.excerpt}
                            </p>
                          )}
                        </div>
                        <div className="pt-2 flex justify-end">
                          <Link
                            href={resolveArticleHref(art)}
                            className="text-xs font-semibold text-purple-700 dark:text-purple-400 group-hover:underline"
                          >
                            Buka Artikel →
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : filteredArticles.length === 0 ? (
              <div className="py-20 text-center space-y-4">
                <div className="text-4xl">🔍</div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Belum ada artikel yang cocok dengan pencarian &quot;{searchQuery}&quot;
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Coba gunakan kata kunci lain atau pilih &quot;Semua Topik&quot; untuk melihat seluruh karya.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("ALL");
                  }}
                  className="px-4 py-2 rounded-full bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 transition-colors"
                >
                  Reset Filter
                </button>
              </div>
            ) : null}

            {/* EDITORIAL BANNER CTA (Write with Studio) */}
            <section className="my-14 rounded-3xl p-8 sm:p-12 relative overflow-hidden bg-gradient-to-r from-[#3c3163] via-[#2a2247] to-[#1a152e] text-white shadow-xl">
              <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-[hsl(257,68%,73%)]/20 blur-3xl" />
              <div className="relative z-10 max-w-2xl space-y-4">
                <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-white/10 border border-white/20">
                  RUANG BERBAGI SUARA
                </span>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight">
                  Punya cerita, refleksi, atau sudut pandang yang ingin dibagikan?
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Semua orang berhak didengar. Tulis ceritamu di LMHY Studio dengan template refleksi terbimbing, publikasikan ke subdomain unik milikmu, dan abadikan secara on-chain bersama Litera.
                </p>
                <div className="pt-2 flex flex-wrap gap-3">
                  <Link
                    href="/builder"
                    className="px-6 py-3 rounded-full font-bold text-xs sm:text-sm bg-white text-slate-950 hover:bg-purple-50 transition-all shadow-md"
                  >
                    Buka LMHY Studio & Mulai Menulis →
                  </Link>
                  <Link
                    href="/"
                    className="px-5 py-3 rounded-full font-semibold text-xs sm:text-sm bg-white/10 hover:bg-white/20 text-white transition-all border border-white/10"
                  >
                    Tentang Let Me Hear You
                  </Link>
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      {/* Footer Minimalist */}
      <footer className="border-t border-black/[0.06] dark:border-white/[0.08] bg-white/60 dark:bg-slate-950/60 py-8">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Let Me Hear You. Ruang pemulihan, refleksi, dan warta kesehatan mental.</p>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:underline">Beranda</Link>
            <Link href="/articles" className="hover:underline font-semibold text-purple-700 dark:text-purple-400">Portal Warta</Link>
            <Link href="/builder" className="hover:underline">Studio Menulis</Link>
            <Link href="/privacy" className="hover:underline">Privasi</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
