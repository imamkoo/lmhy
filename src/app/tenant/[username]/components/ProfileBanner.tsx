"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getBuilderUrl } from "@/lib/builder";
import type { Profile } from "@/lib/supabase/types";
import type { ProfileStats } from "@/lib/profile-storage";
import { toggleFollowAction } from "@/app/actions/profile";
import { signOutAction } from "@/app/actions/auth";

interface ProfileBannerProps {
  profile: Profile;
  stats: ProfileStats;
  isOwnProfile: boolean;
  initialIsFollowing?: boolean;
  onEditClick?: () => void;
}

export function ProfileBanner({
  profile,
  stats,
  isOwnProfile,
  initialIsFollowing = false,
  onEditClick,
}: ProfileBannerProps) {
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [followersCount, setFollowersCount] = useState(stats.followersCount);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const displayName = profile.display_name || profile.username;
  const username = profile.username;
  const bio =
    profile.bio ||
    "Kumpulan refleksi, tulisan kesehatan mental, dan edisi sertifikat digital resmi di Let Me Hear You.";

  const handleToggleFollow = async () => {
    if (!profile.id || isFollowLoading) return;
    setIsFollowLoading(true);
    setShowLoginPrompt(false);

    try {
      const res = await toggleFollowAction(profile.id);
      if (res.success && typeof res.isFollowing === "boolean") {
        setIsFollowing(res.isFollowing);
        setFollowersCount((prev) => (res.isFollowing ? prev + 1 : Math.max(0, prev - 1)));
      } else if (res.error) {
        const lower = res.error.toLowerCase();
        if (lower.includes("masuk") || lower.includes("sesi")) {
          setShowLoginPrompt(true);
        } else {
          setShowLoginPrompt(false);
        }
      }
    } catch (err: unknown) {
      console.error("Failed to follow:", err);
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : `https://${username}.letmehearyou.id`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleEditClick = () => {
    if (onEditClick) {
      onEditClick();
    } else if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("open-edit-profile"));
    }
  };

  // Initials generator
  const initials = displayName
    ? displayName
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : username.slice(0, 2).toUpperCase();

  const isBannerContain = profile.banner_url?.includes("fit=contain");

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm transition">
      {/* Cover Banner with soft gradient fallback */}
      <div className="relative h-44 w-full overflow-hidden bg-[linear-gradient(120deg,#fae8df_0%,#f4d7c8_55%,#eed2c4_100%)] sm:h-56 md:h-64">
        {profile.banner_url ? (
          <>
            {isBannerContain && (
              <>
                <div className="absolute inset-0 bg-[radial-gradient(#F7ABC5_1.3px,transparent_1.3px)] opacity-[.4] [background-size:14px_14px]" />
                <div className="absolute -top-12 right-12 h-32 w-32 rounded-full bg-[rgba(247,171,197,0.3)]" />
                <div className="absolute -bottom-8 left-16 h-24 w-24 rounded-full bg-[rgba(63,55,102,0.08)]" />
              </>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={profile.banner_url}
              alt={`${displayName} Cover Banner`}
              className={
                isBannerContain
                  ? "relative z-10 h-full w-full object-contain p-2 sm:p-4"
                  : "h-full w-full object-cover"
              }
            />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(#F7ABC5_1.3px,transparent_1.3px)] opacity-[.65] [background-size:14px_14px]" />
            <div data-testid="banner-blob-pink" className="absolute -top-12 right-12 h-32 w-32 rounded-full bg-[rgba(247,171,197,0.5)]" />
            <div data-testid="banner-blob-purple" className="absolute -bottom-8 left-16 h-24 w-24 rounded-full bg-[rgba(63,55,102,0.10)]" />
          </>
        )}
      </div>

      {/* Main Profile Info Container */}
      <div className="px-6 pb-8 pt-0 md:px-10">
        {/* Top row with Avatar (left) & Actions (right) right below banner */}
        <div className="relative flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-14 sm:-mt-20">
          {/* Avatar */}
          <div className="relative h-20 w-20 sm:h-28 sm:w-28 md:h-32 md:w-32 shrink-0 overflow-hidden rounded-full border-4 border-white bg-[#F7ABC5] shadow-md flex items-center justify-center text-[#3F3766] font-bold text-xl sm:text-2xl md:text-3xl select-none">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt={displayName}
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = "none";
                }}
              />
            ) : (
              <span>{initials}</span>
            )}
          </div>

          {/* Action CTAs (Placed right below banner, alongside avatar) */}
          <div data-testid="profile-actions" className="w-full sm:w-auto flex flex-wrap items-center justify-start sm:justify-end gap-2 sm:mb-2 sm:gap-2.5">
            {isOwnProfile ? (
              <>
                <button
                  onClick={handleEditClick}
                  className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 sm:px-3.5 sm:py-2.5"
                >
                  <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  <span>Edit Profil</span>
                </button>

                <Link
                  href={getBuilderUrl(username)}
                  className="inline-flex items-center gap-2 whitespace-nowrap rounded-xl bg-[#F7ABC5] px-3.5 py-2 text-xs font-semibold text-[#3F3766] shadow-[0_3px_0_0_#3F3766] transition hover:bg-[#F5E7C6] hover:shadow-[0_2px_0_0_#3F3766] hover:translate-y-[1px] active:shadow-none active:translate-y-[3px] sm:px-4 sm:py-2.5"
                >
                  <span>Buat Konten</span>
                </Link>

                <form action={signOutAction} className="inline-flex">
                  <button
                    type="submit"
                    title="Keluar dari akun Anda"
                    aria-label="Keluar dari akun Anda"
                    className="inline-flex items-center rounded-xl border border-slate-200 bg-white p-2 text-slate-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 sm:p-2.5"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </button>
                </form>
              </>
            ) : (
              <>
                <div className="relative inline-block">
                  <button
                    onClick={handleToggleFollow}
                    disabled={isFollowLoading}
                    className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl px-4 py-2 text-xs font-semibold shadow-sm transition sm:px-5 sm:py-2.5 ${
                      isFollowing
                        ? "border border-slate-300 bg-slate-100 text-slate-800 hover:bg-slate-200"
                        : "bg-[#F7ABC5] text-[#3F3766] hover:bg-[#F5E7C6]"
                    }`}
                  >
                    {isFollowing ? (
                      <>
                        <span>✓ Mengikuti</span>
                      </>
                    ) : (
                      <>
                        <span>+ Ikuti</span>
                      </>
                    )}
                  </button>
                  {showLoginPrompt && (
                    <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                      <div className="flex items-start justify-between">
                        <span className="text-xs font-bold text-slate-900">Ikuti @{username}</span>
                        <button
                          type="button"
                          onClick={() => setShowLoginPrompt(false)}
                          className="text-slate-400 hover:text-slate-600 text-xs"
                        >
                          ✕
                        </button>
                      </div>
                      <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                        Masuk atau daftar terlebih dahulu untuk mengikuti kreator ini dan mendapatkan kabar refleksi terbaru.
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const current = typeof window !== "undefined" ? window.location.pathname : "/";
                            router.push(`/login?next=${encodeURIComponent(current)}`);
                          }}
                          className="flex-1 rounded-xl bg-[#F7ABC5] py-1.5 text-center text-xs font-bold text-[#3F3766] shadow-[0_3px_0_0_#3F3766] hover:bg-[#F5E7C6] hover:shadow-[0_2px_0_0_#3F3766] hover:translate-y-[1px] active:shadow-none active:translate-y-[3px] transition"
                        >
                          Masuk
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const current = typeof window !== "undefined" ? window.location.pathname : "/";
                            router.push(`/login?next=${encodeURIComponent(current)}`);
                          }}
                          className="flex-1 rounded-xl border border-[#3F3766]/15 bg-white py-1.5 text-center text-xs font-bold text-[#3F3766] hover:bg-slate-50 transition"
                        >
                          Daftar
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleShare}
                  className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 sm:px-3.5 sm:py-2.5"
                  title="Salin tautan profil"
                >
                  {copied ? (
                    <span className="text-emerald-600 font-bold">✓ Tersalin!</span>
                  ) : (
                    <>
                      <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                        />
                      </svg>
                      <span>Bagikan</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Display Name & Subdomain Pill */}
        <div className="mt-3 min-w-0 sm:mt-4">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl md:text-4xl">
              {displayName}
            </h1>
            {/* Verified Subdomain Pill */}
            <div
              title="Subdomain Resmi Terverifikasi"
              className="inline-flex items-center gap-1 rounded-full bg-[#F7ABC5]/20 px-3 py-0.5 text-xs font-semibold text-[#3F3766]"
            >
              <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>@{username}</span>
            </div>
            {(() => {
              const providerRole =
                (profile.creator_role === "PENDAMPING" || profile.creator_role === "PRAKTISI") &&
                profile.verification_status === "APPROVED"
                  ? (profile.creator_role as "PENDAMPING" | "PRAKTISI")
                  : null;
              if (!providerRole) return null;
              const isProfessional = providerRole === "PRAKTISI";
              return (
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold tracking-wide shadow-[0_6px_16px_-8px_rgba(63,55,102,0.5),0_2px_8px_-4px_rgba(63,55,102,0.18),inset_0_1px_0_rgba(255,255,255,0.4)] backdrop-blur-md ${
                    isProfessional
                      ? "border-[#3f3766]/12 bg-gradient-to-br from-[#3f3766] via-[#5b4fa0] to-[#8a7cc8] text-white"
                      : "border-[#3f3766]/10 bg-gradient-to-br from-white via-[#f7f3ff] to-[#efe8ff] text-[#3F3766]"
                  }`}
                  title={providerRole === "PRAKTISI" ? "Praktisi Terverifikasi" : "Pendamping Sebaya Terverifikasi"}
                  aria-label={providerRole === "PRAKTISI" ? "Praktisi Terverifikasi" : "Pendamping Sebaya Terverifikasi"}
                >
                  <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ring-1 backdrop-blur-sm ${
                    isProfessional ? "bg-white/18 ring-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]" : "bg-[#3F3766] ring-[#3F3766]/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]"
                  }`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" className={`h-2.5 w-2.5 ${isProfessional ? "text-white" : "text-white"}`}>
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </span>
                  <span>{providerRole === "PRAKTISI" ? "Praktisi" : "Pendamping"}</span>
                  <span aria-hidden="true" className={`h-3 w-px shrink-0 ${isProfessional ? "bg-white/25" : "bg-[#3F3766]/15"}`} />
                  <span className={`text-[8px] font-black tracking-[0.13em] ${isProfessional ? "text-white/80" : "text-[#3F3766]/55"}`}>TERVERIFIKASI</span>
                </span>
              );
            })()}
          </div>

          <p className="mt-1 text-xs text-slate-500 font-medium">
            {username}.letmehearyou.id
          </p>
        </div>

        {/* Bio — keep hierarchy */}
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
          {bio}
        </p>

        {/* Social / External Links (if any) */}
        {(profile.website || profile.facebook_profile_url) && (
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
            {profile.website && (
              <a
                href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:text-[#3F3766]"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <span>{profile.website.replace(/^https?:\/\//, "")}</span>
              </a>
            )}
            {profile.facebook_profile_url && (
              <a
                href={profile.facebook_profile_url.startsWith("http") ? profile.facebook_profile_url : `https://${profile.facebook_profile_url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:text-[#3F3766]"
              >
                <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span>Facebook</span>
              </a>
            )}
          </div>
        )}

        {/* Stats Row */}
        <div className="mt-6 flex items-center gap-6 border-t border-slate-100 pt-5 text-sm">
          <div>
            <span className="font-bold text-slate-900">{stats.articlesCount}</span>{" "}
            <span className="text-slate-500">Refleksi</span>
          </div>
          <div>
            <span className="font-bold text-slate-900">{followersCount}</span>{" "}
            <span className="text-slate-500">Pengikut</span>
          </div>
          <div>
            <span className="font-bold text-slate-900">{stats.followingCount}</span>{" "}
            <span className="text-slate-500">Mengikuti</span>
          </div>
        </div>
      </div>
    </div>
  );
}
