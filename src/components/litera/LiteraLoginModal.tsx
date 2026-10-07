"use client";

import { useState, useEffect, useRef } from "react";

interface LiteraLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (walletAddress: string, method: string) => void;
}

const EVM_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

export function LiteraLoginModal({ isOpen, onClose, onSuccess }: LiteraLoginModalProps) {
  const [popupActive, setPopupActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const popupRef = useRef<Window | null>(null);

  const LITERA_ORIGIN = process.env.NEXT_PUBLIC_LITERA_DASHBOARD_URL || "https://literaa.xyz";

  useEffect(() => {
    if (!isOpen) return;

    // Listener menerima pesan postMessage dari Litera /widget-auth popup di desktop
    const handleAuthMessage = (event: MessageEvent) => {
      // Validasi origin ketat: hanya dari literaa.xyz atau localhost saat development
      const isTrustedOrigin =
        event.origin === "https://literaa.xyz" ||
        event.origin.endsWith(".literaa.xyz") ||
        (process.env.NODE_ENV === "development" && event.origin.includes("localhost"));

      if (!isTrustedOrigin) return;

      const data = event.data;
      if (data && data.type === "LITERA_CLOUD_LOGIN_SUCCESS" && data.address) {
        // Validasi Anti-CSRF State Nonce
        const savedNonce = sessionStorage.getItem("litera_sso_nonce");
        if (data.state && savedNonce && data.state !== savedNonce) {
          setErrorMsg("Sesi autentikasi tidak valid atau telah kedaluwarsa. Silakan coba kembali.");
          setPopupActive(false);
          return;
        }

        // Validasi format alamat EVM
        if (!EVM_ADDRESS_REGEX.test(data.address)) {
          setErrorMsg("Alamat dompet yang diterima tidak valid.");
          setPopupActive(false);
          return;
        }

        sessionStorage.removeItem("litera_sso_nonce");
        onSuccess(data.address, "Litera Dashboard SSO");
        setPopupActive(false);
        if (popupRef.current && !popupRef.current.closed) {
          popupRef.current.close();
        }
        onClose();
      }
    };

    window.addEventListener("message", handleAuthMessage);
    return () => {
      window.removeEventListener("message", handleAuthMessage);
    };
  }, [isOpen, onClose, onSuccess]);

  if (!isOpen) return null;

  const handleLiteraSSO = () => {
    setErrorMsg(null);
    setPopupActive(true);

    const nonce = typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).substring(2) + Date.now().toString(36);

    try {
      sessionStorage.setItem("litera_sso_nonce", nonce);
    } catch {
      // Storage blocked, lanjutkan
    }

    const callbackUrl = typeof window !== "undefined" ? window.location.href : "https://letmehearyou.id/builder";
    const authUrl = `${LITERA_ORIGIN}/widget-auth?article=${encodeURIComponent(callbackUrl)}&state=${encodeURIComponent(nonce)}`;

    // Deteksi lingkungan mobile: gunakan full-page redirect agar bebas popup-blocker dan mulus membuka Rabby/MetaMask mobile
    const ua = typeof navigator !== "undefined" ? navigator.userAgent.toLowerCase() : "";
    const isMobile =
      /android|iphone|ipad|ipod|mobile/i.test(ua) ||
      (typeof window !== "undefined" && window.innerWidth < 640);

    if (isMobile) {
      window.location.href = authUrl;
      return;
    }

    // Lingkungan Desktop: buka popup sembulan
    const w = 460;
    const h = 700;
    const left = window.screenX + (window.outerWidth - w) / 2;
    const top = window.screenY + (window.outerHeight - h) / 2;

    const popup = window.open(
      authUrl,
      "litera-sso-window",
      `width=${w},height=${h},left=${left},top=${top},status=no,menubar=no,toolbar=no`
    );

    if (!popup) {
      // Popup diblokir: fallback ke direct navigation
      window.location.href = authUrl;
      return;
    }

    popupRef.current = popup;
    popup.focus();

    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        setPopupActive(false);
      }
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3F3766]/50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl border-2 border-[#3F3766] bg-[#FAF8F5] p-6 shadow-[0_16px_40px_rgba(63,55,102,0.25)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#3F3766]/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F7ABC5] text-[#3F3766] font-black border border-[#3F3766]/30 shadow-xs">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-[#3F3766]">Hubungkan Akun Litera</h3>
              <p className="text-xs text-[#3F3766]/70">Otentikasi sertifikat &amp; publikasi Web3</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup jendela login"
            className="rounded-lg p-1.5 text-[#3F3766]/50 hover:bg-[#3F3766]/10 hover:text-[#3F3766] transition"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="mt-5 space-y-4">
          <p className="text-xs leading-relaxed text-[#3F3766]/80">
            Penulis menggunakan portal resmi Litera untuk menghubungkan dompet Web3 (Rabby, MetaMask, WalletConnect) atau akun Google &amp; Email secara terverifikasi.
          </p>

          {errorMsg && (
            <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-xs font-semibold text-red-800 leading-relaxed">
              {errorMsg}
            </div>
          )}

          {/* Tombol Utama SSO Litera */}
          <button
            type="button"
            onClick={handleLiteraSSO}
            disabled={popupActive}
            className="w-full flex items-center justify-between rounded-xl border-2 border-[#3F3766] bg-[#F7ABC5] p-4 text-left transition hover:bg-[#F5E7C6] active:translate-y-[1px] disabled:opacity-60 shadow-[0_3px_0_0_#3F3766]"
          >
            <div>
              <span className="block text-sm font-black text-[#3F3766]">
                Masuk melalui Portal Litera
              </span>
              <span className="text-[11px] font-medium text-[#3F3766]/80">
                Pilih Rabby Wallet, MetaMask, Google, atau Email di Litera
              </span>
            </div>
            <span className="text-xs font-black text-[#3F3766] shrink-0 pl-2">
              {popupActive ? "Membuka..." : "Lanjutkan →"}
            </span>
          </button>

          {/* Keamanan & Privacy Box */}
          <div className="rounded-xl bg-[#F5E7C6]/50 p-3.5 border border-[#3F3766]/20 text-[11px] text-[#3F3766] leading-relaxed">
            <span className="font-bold">Keamanan Terjamin:</span> Otentikasi dan izin tanda tangan diproses langsung pada domain terenkripsi resmi <code className="font-mono text-[10px] bg-white/90 px-1 py-0.5 rounded border border-[#3F3766]/20">https://literaa.xyz</code>.
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-xs font-bold text-[#3F3766]/70 hover:bg-[#3F3766]/10 transition"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}
