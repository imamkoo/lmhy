"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
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

// 7 Category Pills matching Maga template structure but with LMHY emotional themes & Warm Sanctuary tokens
const CATEGORIES = [
  { id: "ALL", label: "Semua Warta", icon: "/assets/portal/icons/heart.svg" },
  { id: "Refleksi Diri", label: "Refleksi Diri", icon: "/assets/portal/icons/heart.svg" },
  { id: "Kecemasan", label: "Kecemasan", icon: "/assets/portal/icons/status-up.svg" },
  { id: "Hubungan Jiwa", label: "Hubungan Jiwa", icon: "/assets/portal/icons/global.svg" },
  { id: "Duka & Pulih", label: "Duka & Pulih", icon: "/assets/portal/icons/coffee.svg" },
  { id: "Penerimaan", label: "Penerimaan", icon: "/assets/portal/icons/courthouse.svg" },
  { id: "Mindfulness", label: "Mindfulness", icon: "/assets/portal/icons/cup.svg" },
];

export function ArticlesPortalClient({
  articles,
  authors,
  initialUser,
  initialProfile,
}: ArticlesPortalClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 200);
    return () => clearTimeout(timer);
  }, []);

  // Filtered articles based on search & category
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

  // Featured Carousel Pool (top 3 articles)
  const heroSlides = useMemo(() => {
    return filteredArticles.slice(0, 3).length > 0
      ? filteredArticles.slice(0, 3)
      : articles.slice(0, 3);
  }, [filteredArticles, articles]);

  const currentHero = heroSlides[activeHeroIndex] || heroSlides[0];

  // Up-to-date row (3 cards)
  const upToDateNews = useMemo(() => {
    return filteredArticles.slice(1, 4);
  }, [filteredArticles]);

  // Section 1: Refleksi & Jiwa (Feature left + 5 vertical list right with scrollbar)
  const splitSectionNews = useMemo(() => {
    return filteredArticles.slice(4, 10);
  }, [filteredArticles]);

  const splitHero = splitSectionNews[0];
  const splitList = splitSectionNews.slice(1);

  // Section 2: Arsip Catatan Suara Jiwa (Grid 3 cols)
  const remainingFeed = useMemo(() => {
    return filteredArticles.slice(10);
  }, [filteredArticles]);

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

  const nextHero = () => {
    setActiveHeroIndex((prev) => (prev + 1) % Math.max(1, heroSlides.length));
  };

  const prevHero = () => {
    setActiveHeroIndex((prev) => (prev - 1 + heroSlides.length) % Math.max(1, heroSlides.length));
  };

  return (
    <div className="min-h-screen bg-[#fbf8f5] dark:bg-[#120f1d] text-slate-800 dark:text-slate-100 selection:bg-[#c4b5fd] selection:text-slate-900 transition-colors pb-[72px]">
      {/* Ambient background glowing spheres */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[hsl(257,68%,73%)]/20 blur-3xl" />
        <div className="absolute top-1/3 -right-32 w-[32rem] h-[32rem] rounded-full bg-[hsl(42,73%,74%)]/25 blur-3xl" />
        <div className="absolute -bottom-32 left-1/4 w-[30rem] h-[30rem] rounded-full bg-[hsl(344,81%,87%)]/20 blur-3xl" />
      </div>

      {/* TOP NAVBAR (Sesuai Maga Template Navbar) */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 dark:bg-slate-950/80 border-b border-black/[0.06] dark:border-white/[0.08] transition-all">
        <nav
          id="Navbar"
          className="max-w-[1130px] mx-auto px-4 sm:px-6 flex justify-between items-center py-4 gap-4"
        >
          {/* Logo Brand + Search */}
          <div className="logo-container flex gap-6 items-center flex-1">
            <Link href="/" className="flex shrink-0 items-center gap-3 group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[hsl(257,68%,73%)] to-[hsl(42,73%,74%)] p-0.5 shadow-md shadow-purple-500/10 group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[14px] flex items-center justify-center font-bold text-lg text-[#3c3163] dark:text-purple-300">
                  LH
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900 dark:text-white leading-tight">
                  Let Me Hear You
                </span>
                <span className="text-[10px] font-semibold tracking-widest uppercase text-purple-700 dark:text-purple-400">
                  Warta & Publikasi
                </span>
              </div>
            </Link>

            <div className="hidden lg:block h-10 border-r border-[#E8EBF4] dark:border-white/10" />

            {/* Maga Search Bar */}
            <div className="hidden md:flex items-center flex-1 max-w-[420px]">
              <div className="w-full flex items-center rounded-full border border-[#E8EBF4] dark:border-white/10 bg-white/60 dark:bg-slate-900/60 px-4 py-2.5 gap-2.5 focus-within:ring-2 focus-within:ring-[hsl(257,68%,73%)] focus-within:border-transparent transition-all">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/assets/portal/icons/search-normal.svg"
                  alt="search"
                  className="w-5 h-5 opacity-50 shrink-0"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari esai, refleksi, atau topik kesehatan mental..."
                  className="appearance-none outline-none w-full text-xs font-semibold placeholder:font-normal placeholder:text-[#A3A6AE] bg-transparent text-slate-900 dark:text-white"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="text-xs text-slate-400 hover:text-slate-600 px-1"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/builder"
              className="rounded-full px-5 py-2.5 flex items-center gap-2 font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-[#3c3163] to-[hsl(257,68%,65%)] shadow-md shadow-purple-900/20 hover:shadow-lg hover:shadow-purple-900/30 hover:scale-105 transition-all"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/portal/icons/favorite-chart.svg"
                alt="write"
                className="w-4 h-4 invert shrink-0"
              />
              <span>Tulis Karya</span>
            </Link>

            {initialUser && initialProfile?.username ? (
              <Link
                href={`/tenant/${initialProfile.username}`}
                className="w-9 h-9 rounded-full bg-[hsl(257,68%,73%)]/20 text-[#3c3163] dark:text-purple-300 flex items-center justify-center font-bold text-xs hover:ring-2 hover:ring-[hsl(257,68%,73%)] transition-all"
                title={`Profil @${initialProfile.username}`}
              >
                {initialProfile.username.slice(0, 2).toUpperCase()}
              </Link>
            ) : (
              <Link
                href="/login"
                className="rounded-full px-4 py-2 flex items-center font-semibold text-xs text-slate-700 dark:text-slate-300 border border-[#EEF0F7] dark:border-white/10 hover:ring-2 hover:ring-[hsl(257,68%,73%)] transition-all"
              >
                Masuk
              </Link>
            )}
          </div>
        </nav>

        {/* Mobile Search Input */}
        <div className="md:hidden px-4 pb-3">
          <div className="w-full flex items-center rounded-full border border-[#E8EBF4] dark:border-white/10 bg-white dark:bg-slate-900 px-3.5 py-2 gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/portal/icons/search-normal.svg" alt="search" className="w-4 h-4 opacity-50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari karya atau topik..."
              className="appearance-none outline-none w-full text-xs font-semibold placeholder:font-normal placeholder:text-[#A3A6AE] bg-transparent"
            />
          </div>
        </div>

        {/* CATEGORY PILL BAR (Sesuai Maga Template #Category) */}
        <nav
          id="Category"
          className="max-w-[1130px] mx-auto px-4 sm:px-6 flex justify-start sm:justify-center items-center gap-3 py-2.5 overflow-x-auto no-scrollbar border-t border-black/[0.04] dark:border-white/[0.04]"
        >
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`rounded-full px-4 py-2 flex items-center gap-2 font-semibold text-xs transition-all duration-300 shrink-0 border ${
                  active
                    ? "bg-[#3c3163] text-white border-transparent shadow-md shadow-purple-950/20"
                    : "bg-white/80 dark:bg-white/[0.05] text-slate-700 dark:text-slate-300 border-[#EEF0F7] dark:border-white/10 hover:ring-2 hover:ring-[hsl(257,68%,73%)]"
                }`}
              >
                <div className="w-4 h-4 flex shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={cat.icon}
                    alt={cat.label}
                    className={`w-full h-full object-contain ${active ? "brightness-200" : "opacity-80"}`}
                  />
                </div>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </nav>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-[1130px] mx-auto px-4 sm:px-6 mt-8 relative z-10">
        {isLoading ? (
          <div className="space-y-8 animate-pulse">
            <div className="h-[520px] rounded-[24px] bg-slate-200 dark:bg-slate-800/60" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-72 rounded-[20px] bg-slate-200 dark:bg-slate-800/60" />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* SECTION 1: FEATURED CAROUSEL (Sesuai Maga #Featured dengan Prev/Next Button) */}
            {currentHero && (
              <section id="Featured" className="w-full mb-16">
                <div className="relative w-full h-[480px] sm:h-[540px] rounded-[28px] overflow-hidden shadow-2xl shadow-purple-950/15 border border-white/40 dark:border-white/10">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentHero.id || currentHero.slug}
                      initial={{ opacity: 0, scale: 1.02 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4 }}
                      className="absolute inset-0"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={currentHero.media_url || "/assets/portal/news/cover-7.png"}
                        alt={currentHero.title}
                        className="w-full h-full object-cover"
                      />
                    </motion.div>
                  </AnimatePresence>

                  {/* Multilayer Dark Vignette Gradient */}
                  <div className="w-full h-full bg-gradient-to-t from-[rgba(18,15,29,0.95)] via-[rgba(18,15,29,0.45)] to-transparent absolute inset-0 z-10" />

                  {/* Card Detail & Carousel Controls */}
                  <div className="w-full h-full flex items-end justify-between p-6 sm:p-12 relative z-20">
                    <div className="flex flex-col gap-3 max-w-2xl">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full px-3.5 py-1 bg-[hsl(257,68%,73%)] text-slate-950 font-extrabold text-xs tracking-wider uppercase shadow-md">
                          Featured
                        </span>
                        {currentHero.litera_status === "MINTED" && (
                          <span className="rounded-full px-3 py-1 bg-emerald-500/90 text-white font-bold text-[11px] backdrop-blur-md flex items-center gap-1 shadow-sm">
                            <span>⛓️</span> Litera Verified
                          </span>
                        )}
                      </div>

                      <Link
                        href={resolveArticleHref(currentHero)}
                        className="font-extrabold text-2xl sm:text-4xl lg:text-5xl leading-tight text-white line-clamp-2 hover:text-purple-200 hover:underline transition-all duration-300 drop-shadow-md"
                      >
                        {currentHero.title}
                      </Link>

                      {currentHero.excerpt && (
                        <p className="text-sm sm:text-base text-slate-200/90 line-clamp-2 font-light leading-relaxed max-w-xl drop-shadow">
                          {currentHero.excerpt}
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-xs text-white/80 pt-1">
                        <Link
                          href={resolveAuthorHref(currentHero.username)}
                          className="font-semibold text-white hover:underline flex items-center gap-1.5"
                        >
                          <span className="w-6 h-6 rounded-full bg-white/20 text-white flex items-center justify-center font-bold text-[10px]">
                            {currentHero.username.slice(0, 2).toUpperCase()}
                          </span>
                          <span>@{currentHero.username}</span>
                        </Link>
                        <span>•</span>
                        <span>{formatDate(currentHero.published_at)}</span>
                        <span>•</span>
                        <span className="text-[hsl(42,73%,74%)] font-bold">
                          {currentHero.tags?.[0] || "Refleksi"}
                        </span>
                      </div>
                    </div>

                    {/* Prev/Next Buttons */}
                    {heroSlides.length > 1 && (
                      <div className="flex items-center gap-3 mb-2 shrink-0">
                        <button
                          onClick={prevHero}
                          aria-label="Previous slide"
                          className="w-11 h-11 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-md ring-1 ring-white/50 hover:ring-2 hover:ring-[hsl(257,68%,73%)] hover:bg-white hover:text-slate-900 transition-all duration-300"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src="/assets/portal/icons/arrow.svg" alt="prev" className="w-4 h-4 invert" />
                        </button>
                        <button
                          onClick={nextHero}
                          aria-label="Next slide"
                          className="w-11 h-11 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-md ring-1 ring-white/50 hover:ring-2 hover:ring-[hsl(257,68%,73%)] hover:bg-white hover:text-slate-900 transition-all duration-300 rotate-180"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src="/assets/portal/icons/arrow.svg" alt="next" className="w-4 h-4 invert" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* SECTION 2: UP TO DATE (Sesuai Maga #Up-to-date 3 Columns) */}
            {upToDateNews.length > 0 && (
              <section id="Up-to-date" className="flex flex-col gap-6 mb-16">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="font-extrabold text-2xl sm:text-3xl text-slate-900 dark:text-white tracking-tight">
                      Karya Terbaru & Hot <br className="hidden sm:inline" />
                      Refleksi untuk Jiwa
                    </h2>
                  </div>
                  <p className="rounded-full px-4 py-2 bg-[#f2eefc] dark:bg-purple-950/60 font-bold text-xs uppercase tracking-wider text-[#3c3163] dark:text-purple-300 w-fit border border-purple-200/50 dark:border-white/5">
                    UP TO DATE
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {upToDateNews.map((art, idx) => (
                    <motion.div
                      key={art.id || `${art.slug}-${idx}`}
                      whileHover={{ y: -6 }}
                      transition={{ duration: 0.2 }}
                      className="group flex flex-col rounded-[22px] border border-[#EEF0F7] dark:border-white/10 p-5 gap-4 hover:border-[hsl(257,68%,73%)] hover:shadow-xl hover:shadow-purple-950/5 transition-all duration-300 bg-white dark:bg-slate-900/80"
                    >
                      <Link
                        href={resolveArticleHref(art)}
                        className="w-full h-[200px] rounded-[18px] flex shrink-0 overflow-hidden relative"
                      >
                        <p className="absolute top-4 left-4 z-10 rounded-full px-3 py-1 bg-white/95 dark:bg-slate-900/90 font-extrabold text-[10px] tracking-wider uppercase text-slate-900 dark:text-white shadow-sm">
                          {art.tags?.[0] || "Refleksi"}
                        </p>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={art.media_url || "/assets/portal/news/cover-4.png"}
                          alt={art.title}
                          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                        />
                      </Link>

                      <div className="flex flex-col gap-2 flex-1 justify-between">
                        <div className="space-y-1.5">
                          <Link href={resolveArticleHref(art)}>
                            <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-colors line-clamp-2 leading-snug">
                              {art.title}
                            </h3>
                          </Link>
                          {art.excerpt && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                              {art.excerpt}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/5 text-xs text-slate-400">
                          <Link
                            href={resolveAuthorHref(art.username)}
                            className="font-medium text-slate-600 dark:text-slate-300 hover:underline flex items-center gap-1.5"
                          >
                            <span className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/50 text-[#3c3163] dark:text-purple-300 flex items-center justify-center font-bold text-[10px]">
                              {art.username.charAt(0).toUpperCase()}
                            </span>
                            <span>@{art.username}</span>
                          </Link>
                          <span>{formatDate(art.published_at)}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* SECTION 3: BEST AUTHORS (Sesuai Maga #Best-authors 6 Columns) */}
            {authors.length > 0 && (
              <section id="Best-authors" className="flex flex-col gap-6 mb-16 text-center">
                <div className="flex flex-col items-center gap-2 max-w-lg mx-auto">
                  <p className="rounded-full px-4 py-1.5 bg-[#f2eefc] dark:bg-purple-950/60 font-bold text-xs uppercase tracking-wider text-[#3c3163] dark:text-purple-300 w-fit">
                    BEST AUTHORS
                  </p>
                  <h2 className="font-extrabold text-2xl sm:text-3xl text-slate-900 dark:text-white tracking-tight">
                    Jelajahi Seluruh Mahakarya <br />
                    yang Ditulis oleh Kontributor
                  </h2>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  {authors.map((auth, idx) => (
                    <Link
                      key={auth.username || idx}
                      href={resolveAuthorHref(auth.username)}
                      className="rounded-[20px] border border-[#EEF0F7] dark:border-white/10 p-5 flex flex-col items-center gap-3.5 hover:ring-2 hover:ring-[hsl(257,68%,73%)] hover:shadow-lg transition-all duration-300 bg-white dark:bg-slate-900/80 group"
                    >
                      <div className="w-[70px] h-[70px] flex shrink-0 rounded-full overflow-hidden ring-2 ring-purple-100 dark:ring-purple-900/50 group-hover:scale-105 transition-transform">
                        {auth.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={auth.avatar_url} alt={auth.username} className="object-cover w-full h-full" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-tr from-[hsl(257,68%,73%)] to-[hsl(42,73%,74%)] flex items-center justify-center font-bold text-white text-lg">
                            {auth.username.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-0.5 text-center w-full">
                        <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                          {auth.display_name || `@${auth.username}`}
                        </p>
                        <p className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold tracking-wider uppercase">
                          {auth.creator_role || "Kreator"}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* SECTION 4: SPLIT FEATURED + SCROLLABLE LIST (Sesuai Maga #Latest-entertainment) */}
            {splitHero && (
              <section id="Latest-refleksi" className="flex flex-col gap-6 mb-16">
                <div className="flex justify-between items-center">
                  <h2 className="font-extrabold text-2xl sm:text-3xl text-slate-900 dark:text-white tracking-tight">
                    Catatan Pilihan Jiwa & Ruang Dengar
                  </h2>
                  <Link
                    href="#Up-to-date"
                    className="rounded-full px-5 py-2 flex items-center gap-2 font-semibold text-xs border border-[#EEF0F7] dark:border-white/10 hover:ring-2 hover:ring-[hsl(257,68%,73%)] transition-all"
                  >
                    Eksplorasi
                  </Link>
                </div>

                <div className="flex flex-col lg:flex-row gap-6 items-stretch">
                  {/* Left Big Feature Card */}
                  <div className="relative w-full lg:flex-1 h-[424px] rounded-[24px] overflow-hidden shadow-xl border border-black/5 dark:border-white/10 group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={splitHero.media_url || "/assets/portal/news/cover-5.png"}
                      alt={splitHero.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="w-full h-full bg-gradient-to-t from-[rgba(18,15,29,0.92)] via-[rgba(18,15,29,0.45)] to-transparent absolute inset-0 z-10" />
                    <div className="w-full h-full flex flex-col justify-end p-6 sm:p-8 relative z-20 gap-2">
                      <span className="rounded-full px-3 py-1 bg-[hsl(257,68%,73%)] text-slate-950 font-extrabold text-[10px] tracking-wider uppercase w-fit">
                        {splitHero.tags?.[0] || "Refleksi"}
                      </span>
                      <Link
                        href={resolveArticleHref(splitHero)}
                        className="font-extrabold text-xl sm:text-2xl text-white hover:underline transition-all line-clamp-2 leading-snug"
                      >
                        {splitHero.title}
                      </Link>
                      <p className="text-xs text-slate-300 line-clamp-2">
                        {splitHero.excerpt}
                      </p>
                      <p className="text-xs text-purple-300 font-medium pt-1">
                        @{splitHero.username} • {formatDate(splitHero.published_at)}
                      </p>
                    </div>
                  </div>

                  {/* Right Scrollable Vertical List (Maga custom-scrollbar) */}
                  <div className="w-full lg:w-[460px] h-[424px] overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-3">
                    {splitList.map((art, idx) => (
                      <Link
                        key={art.id || `${art.slug}-${idx}`}
                        href={resolveArticleHref(art)}
                        className="rounded-[20px] border border-[#EEF0F7] dark:border-white/10 p-3.5 flex items-center gap-3.5 hover:ring-2 hover:ring-[hsl(257,68%,73%)] transition-all bg-white dark:bg-slate-900/80 group shrink-0"
                      >
                        <div className="w-[110px] h-[86px] rounded-[14px] overflow-hidden shrink-0 relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={art.media_url || "/assets/portal/news/cover-3.png"}
                            alt={art.title}
                            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <div className="flex flex-col gap-1 flex-1">
                          <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors leading-snug">
                            {art.title}
                          </h3>
                          <p className="text-[11px] text-[#A3A6AE]">
                            @{art.username} • {formatDate(art.published_at)}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* SECTION 5: ARSIP CATATAN TAMBAHAN (Feed Grid) */}
            {remainingFeed.length > 0 && (
              <section className="flex flex-col gap-6 mb-16">
                <h2 className="font-extrabold text-2xl sm:text-3xl text-slate-900 dark:text-white tracking-tight">
                  Arsip Karya Komunitas Lainnya
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {remainingFeed.map((art, idx) => (
                    <div
                      key={art.id || `${art.slug}-${idx}`}
                      className="flex flex-col bg-white dark:bg-slate-900/80 rounded-[20px] p-4 border border-[#EEF0F7] dark:border-white/10 gap-3 group hover:border-[hsl(257,68%,73%)] transition-all"
                    >
                      <div className="w-full h-40 rounded-[14px] overflow-hidden relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={art.media_url || "/assets/portal/news/cover.png"}
                          alt={art.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <div className="flex flex-col justify-between flex-1 gap-2">
                        <Link href={resolveArticleHref(art)}>
                          <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                            {art.title}
                          </h3>
                        </Link>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-white/5">
                          <span>@{art.username}</span>
                          <Link href={resolveArticleHref(art)} className="font-bold text-purple-600 dark:text-purple-400">
                            Baca →
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* SECTION 6: STUDIO CTA BANNER */}
            <section className="my-14 rounded-[28px] p-8 sm:p-12 relative overflow-hidden bg-gradient-to-r from-[#3c3163] via-[#2a2247] to-[#1a152e] text-white shadow-2xl">
              <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-[hsl(257,68%,73%)]/25 blur-3xl pointer-events-none" />
              <div className="relative z-10 max-w-2xl space-y-4">
                <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-white/10 border border-white/20">
                  RUANG BERBAGI SUARA
                </span>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight">
                  Punya cerita atau sudut pandang yang ingin dibagikan?
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

      {/* FOOTER */}
      <footer className="border-t border-[#EEF0F7] dark:border-white/10 bg-white/60 dark:bg-slate-950/60 py-8 mt-16">
        <div className="max-w-[1130px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
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
