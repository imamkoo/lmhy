'use client';

import { useState } from 'react';

export interface SocialShareBarProps {
  url?: string;
  title: string;
  authorUsername: string;
  className?: string;
}

export function SocialShareBar({
  url,
  title,
  authorUsername,
  className = '',
}: SocialShareBarProps) {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const getResolvedUrl = (): string => {
    if (url) return url;
    if (typeof window !== 'undefined') {
      return window.location.href;
    }
    return `https://${authorUsername}.letmehearyou.id`;
  };

  const handleFacebookShare = () => {
    const shareUrl = getResolvedUrl();
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    const w = 620;
    const h = 480;
    const left = typeof window !== 'undefined' ? window.screenX + (window.outerWidth - w) / 2 : 100;
    const top = typeof window !== 'undefined' ? window.screenY + (window.outerHeight - h) / 2 : 100;

    window.open(
      fbUrl,
      'facebook-share-dialog',
      `width=${w},height=${h},top=${top},left=${left},toolbar=0,status=0,menubar=0`
    );
  };

  const handleWhatsAppShare = () => {
    const shareUrl = getResolvedUrl();
    const text = `"${title}" oleh @${authorUsername}\n\nBaca selengkapnya di Let Me Hear You:\n${shareUrl}`;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleTwitterShare = () => {
    const shareUrl = getResolvedUrl();
    const text = `Membaca refleksi "${title}" oleh @${authorUsername} di Let Me Hear You`;
    const twUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`;
    window.open(twUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopyLink = async () => {
    const shareUrl = getResolvedUrl();
    try {
      await navigator.clipboard.writeText(shareUrl);
      setToastMessage('Tautan berhasil disalin ke papan klip! 📋');
    } catch {
      // Fallback
      setToastMessage('Tautan disiapkan!');
    }

    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  return (
    <div
      className={`my-8 rounded-3xl border border-slate-200/90 bg-white/80 p-5 shadow-sm backdrop-blur-xs transition sm:p-6 ${className}`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Share Title and Explanation */}
        <div>
          <h4 className="text-sm font-bold text-slate-900">
            Bagikan Refleksi Ini
          </h4>
          <p className="text-xs text-slate-500">
            Sebarkan wawasan dan ketenangan pikiran ke jejaring sosial Anda.
          </p>
        </div>

        {/* Share Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Facebook Share Button */}
          <button
            type="button"
            onClick={handleFacebookShare}
            aria-label="Bagikan ke Facebook"
            className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/60 px-3.5 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 hover:border-blue-300 active:scale-95"
          >
            <svg className="h-4 w-4 fill-current text-blue-600" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            <span>Facebook</span>
          </button>

          {/* WhatsApp Share Button */}
          <button
            type="button"
            onClick={handleWhatsAppShare}
            aria-label="Bagikan ke WhatsApp"
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50/60 px-3.5 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 hover:border-emerald-300 active:scale-95"
          >
            <svg className="h-4 w-4 fill-current text-emerald-600" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.301-.15-1.782-.879-2.058-.98-.276-.1-.477-.15-.678.15-.201.301-.778.98-.954 1.18-.176.201-.352.226-.653.075-.301-.15-1.272-.469-2.423-1.496-.896-.798-1.501-1.784-1.677-2.085-.176-.301-.019-.464.132-.614.135-.135.301-.352.452-.528.15-.176.201-.301.301-.502.1-.201.05-.377-.025-.528-.075-.15-.678-1.634-.929-2.238-.244-.588-.492-.508-.678-.518-.176-.01-.377-.01-.578-.01-.201 0-.528.075-.804.377-.276.301-1.055 1.03-1.055 2.512s1.08 2.914 1.231 3.115c.15.201 2.125 3.245 5.148 4.551.719.311 1.28.497 1.718.636.722.229 1.379.197 1.9-.12.58-.354 1.782-.729 2.033-1.433.251-.703.251-1.306.176-1.432-.075-.126-.276-.201-.578-.351zM12.04 2C6.51 2 2.02 6.49 2.02 12.02c0 1.94.55 3.75 1.5 5.28L2 22l4.85-1.48c1.48.87 3.2 1.37 5.19 1.37 5.53 0 10.02-4.49 10.02-10.02C22.06 6.49 17.57 2 12.04 2z" />
            </svg>
            <span>WhatsApp</span>
          </button>

          {/* X / Twitter Share Button */}
          <button
            type="button"
            onClick={handleTwitterShare}
            aria-label="Bagikan ke X Twitter"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 hover:border-slate-300 active:scale-95"
          >
            <svg className="h-3.5 w-3.5 fill-current text-slate-800" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            <span>X (Twitter)</span>
          </button>

          {/* Copy Link Button */}
          <button
            type="button"
            onClick={handleCopyLink}
            aria-label="Salin Tautan Artikel"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:border-[#F7ABC5] hover:text-[#3F3766] active:scale-95"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            <span>Salin Tautan</span>
          </button>
        </div>
      </div>

      {/* Toast Feedback Notification */}
      {toastMessage && (
        <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-medium text-white shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200">
          <span>✓</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
