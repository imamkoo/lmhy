"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function InstallAppBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState<"android" | "ios" | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Register service worker if supported
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // SW registration failed, ignore
      });
    }

    // Pastikan hanya muncul saat pertama kali akses, tidak pernah muncul lagi saat navigasi/pindah page
    try {
      if (
        localStorage.getItem("lmhy_pwa_first_visit_shown") === "true" ||
        sessionStorage.getItem("lmhy_pwa_session_seen") === "true"
      ) {
        return;
      }
    } catch {
      // Storage access blocked/private mode
    }

    const dismissedAt = localStorage.getItem("lmhy_install_dismissed");
    if (dismissedAt) {
      const daysSinceDismiss = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismiss < 7) {
        return; // Don't show again within 7 days of dismissal
      }
    }

    // Check if already running in standalone (PWA) mode
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes("android-app://");

    if (isStandalone) {
      return;
    }

    // Check if running on mobile device (Android/iOS phone or tablet)
    const ua = window.navigator.userAgent.toLowerCase();
    const isMobileDevice =
      /android|iphone|ipad|ipod|mobile/i.test(ua) ||
      window.matchMedia("(max-width: 768px)").matches;

    if (!isMobileDevice) {
      return; // Suppress install prompt on desktop browsers
    }

    const markAsShown = () => {
      try {
        localStorage.setItem("lmhy_pwa_first_visit_shown", "true");
        sessionStorage.setItem("lmhy_pwa_session_seen", "true");
      } catch {
        // ignore
      }
    };

    // Android & Chromium: listen to beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      markAsShown();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt("android");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // iOS Safari detection: iPhone/iPad/iPod, not standalone, and Safari browser
    const isIOS = /iphone|ipad|ipod/.test(ua);
    const isSafari = ua.includes("safari") && !ua.includes("crios") && !ua.includes("fxios");

    let timer: NodeJS.Timeout | null = null;
    if (isIOS && !isStandalone && (isSafari || !("beforeinstallprompt" in window))) {
      timer = setTimeout(() => {
        markAsShown();
        setShowPrompt("ios");
      }, 2500);
    }

    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setShowPrompt(null);
      }
      setDeferredPrompt(null);
      try {
        localStorage.setItem("lmhy_pwa_first_visit_shown", "true");
        sessionStorage.setItem("lmhy_pwa_session_seen", "true");
      } catch {
        // ignore
      }
    } catch {
      // Fallback
    }
  };

  const handleDismiss = () => {
    setShowPrompt(null);
    try {
      localStorage.setItem("lmhy_pwa_first_visit_shown", "true");
      sessionStorage.setItem("lmhy_pwa_session_seen", "true");
      localStorage.setItem("lmhy_install_dismissed", Date.now().toString());
    } catch {
      // ignore
    }
  };

  if (!showPrompt) {
    return null;
  }

  return (
    <aside
      aria-label="Rekomendasi instalasi aplikasi"
      className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="flex flex-col gap-3 rounded-2xl border-2 border-[#3F3766] bg-[#FAF8F5] p-4 shadow-[0_12px_36px_rgba(63,55,102,0.25)]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-[#F7ABC5]/30 p-0.5 shadow-xs">
              <Image
                src="/icon-192.png"
                alt="Logo Let Me Hear You"
                width={44}
                height={44}
                className="h-full w-full rounded-lg object-cover"
              />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-[#3F3766]">
                Install Aplikasi Let Me Hear You
              </h3>
              <p className="text-xs text-slate-600">
                Akses cepat menulis &amp; membaca di layar utama Anda.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Tutup rekomendasi instalasi"
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-200/60 hover:text-slate-700 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {showPrompt === "android" && deferredPrompt && (
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={handleDismiss}
              className="rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 cursor-pointer"
            >
              Nanti Saja
            </button>
            <button
              type="button"
              onClick={handleInstallClick}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#F7ABC5] px-4 py-2 text-xs font-bold text-[#3F3766] shadow-[0_2px_0_0_#3F3766] transition hover:bg-[#F5E7C6] active:translate-y-[2px] active:shadow-none cursor-pointer"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Install Aplikasi</span>
            </button>
          </div>
        )}

        {showPrompt === "ios" && (
          <div className="mt-1 rounded-xl bg-white/80 p-2.5 text-xs text-[#3F3766] border border-slate-200/80">
            <p className="flex items-center gap-1.5 font-medium">
              <span>Petunjuk install di iOS:</span>
            </p>
            <ol className="mt-1 list-decimal list-inside space-y-0.5 text-[11px] text-slate-600">
              <li>Ketuk tombol <strong>Bagikan</strong> (ikon kotak panah atas ⎙/⎋ di Safari).</li>
              <li>Pilih <strong>Tambah ke Layar Utama (Add to Home Screen) ⊕</strong>.</li>
            </ol>
          </div>
        )}
      </div>
    </aside>
  );
}
