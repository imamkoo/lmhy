'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toggleFollowAction } from '@/app/actions/community';

export interface FollowButtonProps {
  targetUserId: string;
  targetUsername?: string;
  initialIsFollowing?: boolean;
  initialFollowersCount?: number;
  showCount?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onFollowChange?: (isFollowing: boolean, newCount: number) => void;
}

export function FollowButton({
  targetUserId,
  targetUsername = 'kreator',
  initialIsFollowing = false,
  initialFollowersCount = 0,
  showCount = false,
  size = 'md',
  className = '',
  onFollowChange,
}: FollowButtonProps) {
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [followersCount, setFollowersCount] = useState(initialFollowersCount);
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const handleToggle = async () => {
    if (!targetUserId || isLoading) return;

    // Optimistic UI updates
    const prevFollowing = isFollowing;
    const prevCount = followersCount;
    const nextFollowing = !prevFollowing;
    const nextCount = nextFollowing ? prevCount + 1 : Math.max(0, prevCount - 1);

    setIsFollowing(nextFollowing);
    setFollowersCount(nextCount);
    setIsLoading(true);
    setShowLoginPrompt(false);

    try {
      const res = await toggleFollowAction(targetUserId);

      if (res.error) {
        // Rollback state on error
        setIsFollowing(prevFollowing);
        setFollowersCount(prevCount);

        if (
          res.error.toLowerCase().includes('masuk') ||
          res.error.toLowerCase().includes('sesi')
        ) {
          setShowLoginPrompt(true);
        } else {
          alert(res.error);
        }
        return;
      }

      setIsFollowing(res.isFollowing);
      const actualCount = res.isFollowing ? prevCount + 1 : Math.max(0, prevCount - 1);
      setFollowersCount(actualCount);
      onFollowChange?.(res.isFollowing, actualCount);
    } catch (err: unknown) {
      console.error('[FollowButton] Failed to toggle follow:', err);
      setIsFollowing(prevFollowing);
      setFollowersCount(prevCount);
    } finally {
      setIsLoading(false);
    }
  };

  // Size styling variants
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs font-semibold rounded-lg',
    md: 'px-4 py-2 text-xs font-semibold rounded-xl',
    lg: 'px-6 py-2.5 text-sm font-semibold rounded-2xl',
  }[size];

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={handleToggle}
        disabled={isLoading}
        aria-pressed={isFollowing}
        className={`inline-flex items-center gap-1.5 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-[#F7ABC5]/50 disabled:opacity-70 ${sizeClasses} ${
          isFollowing
            ? 'border border-slate-300 bg-slate-100 text-slate-800 hover:bg-slate-200/80 hover:text-red-700 hover:border-red-200 group'
            : 'bg-[#F7ABC5] text-[#3F3766] hover:bg-[#F5E7C6] active:scale-[0.98]'
        } ${className}`}
      >
        {isLoading ? (
          <svg
            className="h-3.5 w-3.5 animate-spin text-current"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
        ) : isFollowing ? (
          <>
            <span className="group-hover:hidden">✓ Mengikuti</span>
            <span className="hidden group-hover:inline">Berhenti</span>
          </>
        ) : (
          <>
            <span>+ Ikuti</span>
          </>
        )}

        {showCount && (
          <span
            className={`ml-1 text-[11px] font-bold ${
              isFollowing ? 'text-slate-500' : 'text-white/80'
            }`}
          >
            {followersCount}
          </span>
        )}
      </button>

      {/* Unauthenticated Login Prompt Dialog */}
      {showLoginPrompt && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold text-slate-900">
              Ikuti @{targetUsername}
            </span>
            <button
              type="button"
              onClick={() => setShowLoginPrompt(false)}
              className="text-slate-400 hover:text-slate-600 text-xs"
            >
              ✕
            </button>
          </div>
          <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
            Masuk terlebih dahulu untuk mengikuti kreator ini dan mendapatkan kabar refleksi terbaru.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const current = typeof window !== 'undefined' ? window.location.pathname : '/';
                router.push(`/login?next=${encodeURIComponent(current)}`);
              }}
              className="w-full rounded-xl bg-[#F7ABC5] py-1.5 text-center text-xs font-bold text-[#3F3766] shadow-[0_3px_0_0_#3F3766] hover:bg-[#F5E7C6] hover:shadow-[0_2px_0_0_#3F3766] hover:translate-y-[1px] active:shadow-none active:translate-y-[3px] transition"
            >
              Masuk Sekarang
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
