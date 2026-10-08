"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useConnect } from "wagmi";
import {
  mountWeb3Modal,
  openWeb3ModalSafe,
  probeWalletListReachable,
  subscribeWeb3ModalState,
} from "./web3modal-lazy";

interface LiteraLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (walletAddress: string, method: string) => void;
}

const EVM_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

export function LiteraLoginModal({
  isOpen,
  onClose,
  onSuccess,
}: LiteraLoginModalProps) {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [walletListBlocked, setWalletListBlocked] = useState(false);
  const popupRef = useRef<Window | null>(null);

  const { connectAsync, connectors } = useConnect();

  const LITERA_ORIGIN =
    process.env.NEXT_PUBLIC_LITERA_DASHBOARD_URL || "https://literaa.xyz";

  const handleClose = useCallback(() => {
    setErrorMsg(null);
    onClose();
  }, [onClose]);

  // Preload chunk Web3Modal & probe ketersediaan daftar wallet saat modal dibuka
  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    mountWeb3Modal().catch(() => {
      // Error disimpan di loadState, subscriber menampilkan
    });

    const unsubscribe = subscribeWeb3ModalState((s) => {
      if (!cancelled && s.error) setErrorMsg(s.error);
    });

    probeWalletListReachable().then((ok) => {
      if (!cancelled) setWalletListBlocked(!ok);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [isOpen]);

  // SSO Message Listener (Email / Google via Privy di Litera Cloud)
  useEffect(() => {
    if (!isOpen) return;

    const handleAuthMessage = (event: MessageEvent) => {
      const isTrustedOrigin =
        event.origin === "https://literaa.xyz" ||
        event.origin.endsWith(".literaa.xyz") ||
        (process.env.NODE_ENV === "development" &&
          event.origin.includes("localhost"));

      if (!isTrustedOrigin) return;

      const data = event.data;
      if (data && data.type === "LITERA_CLOUD_LOGIN_SUCCESS" && data.address) {
        const savedNonce = sessionStorage.getItem("litera_sso_nonce");
        if (data.state && savedNonce && data.state !== savedNonce) {
          setErrorMsg("Sesi autentikasi tidak valid atau telah kedaluwarsa.");
          return;
        }

        if (!EVM_ADDRESS_REGEX.test(data.address)) {
          setErrorMsg("Alamat dompet yang diterima tidak valid.");
          return;
        }

        sessionStorage.removeItem("litera_sso_nonce");
        onSuccess(data.address, "Litera Cloud (Email / Google)");
        if (popupRef.current && !popupRef.current.closed) {
          popupRef.current.close();
        }
        handleClose();
      }
    };

    window.addEventListener("message", handleAuthMessage);
    return () => {
      window.removeEventListener("message", handleAuthMessage);
    };
  }, [isOpen, handleClose, onSuccess]);

  if (!isOpen) return null;

  // Handler: Login via Litera Cloud (Email atau Google via Privy)
  const handleEmailGoogleLogin = () => {
    setErrorMsg(null);

    const nonce =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2) + Date.now().toString(36);

    try {
      sessionStorage.setItem("litera_sso_nonce", nonce);
    } catch {
      // Storage blocked, lanjutkan
    }

    const callbackUrl =
      typeof window !== "undefined"
        ? window.location.href
        : "https://letmehearyou.id/builder";
    const authUrl = `${LITERA_ORIGIN}/widget-auth?article=${encodeURIComponent(
      callbackUrl
    )}&state=${encodeURIComponent(nonce)}`;

    const ua =
      typeof navigator !== "undefined" ? navigator.userAgent.toLowerCase() : "";
    const isMobile =
      /android|iphone|ipad|ipod|mobile/i.test(ua) ||
      (typeof window !== "undefined" && window.innerWidth < 640);

    if (isMobile) {
      window.location.assign(authUrl);
      return;
    }

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
      window.location.assign(authUrl);
      return;
    }

    popupRef.current = popup;
    popup.focus();
  };

  // Handler: Koneksi Dompet Web3 (Injected-first -> Fallback Web3Modal AppKit)
  const handleConnectWallet = async () => {
    setErrorMsg(null);

    // 1. Prioritaskan Injected Connector bila browser memiliki window.ethereum (ekstensi / in-app dApp browser)
    const injectedConnector = connectors?.find((c) => c.id === "injected");
    const hasInjectedProvider =
      typeof window !== "undefined" &&
      Boolean((window as unknown as { ethereum?: unknown }).ethereum);

    if (hasInjectedProvider && injectedConnector) {
      handleClose();
      try {
        await connectAsync({ connector: injectedConnector });
        return;
      } catch (err: unknown) {
        const message = (
          (err as { message?: string })?.message || ""
        ).toLowerCase();
        const name = (err as { name?: string })?.name || "";
        if (
          name === "UserRejectedRequestError" ||
          message.includes("reject") ||
          message.includes("denied")
        ) {
          return;
        }
      }
    }

    // 2. Fallback ke Web3Modal resmi Reown AppKit (Mobile QR / Deep-link view "Connect Wallet")
    handleClose();
    try {
      openWeb3ModalSafe();
    } catch {
      setErrorMsg(
        "Gagal memuat dialog dompet. Silakan gunakan opsi Email atau Google."
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
      onClick={handleClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Autentikasi Litera"
        className="relative w-full sm:max-w-[420px] max-h-[85vh] flex flex-col overflow-hidden rounded-t-[32px] sm:rounded-[28px] border border-white/70 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative z-[1] p-7 pb-6">
          {/* Tombol Tutup */}
          <button
            type="button"
            className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-full transition-colors cursor-pointer"
            onClick={handleClose}
            aria-label="Tutup jendela login"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>

          <h2 className="text-[1.55rem] font-[800] tracking-[-0.04em] text-gray-900 leading-tight">
            Masuk ke Litera
          </h2>
          <p className="text-[0.88rem] text-gray-500 mt-2 mb-6 leading-relaxed">
            Pilih cara untuk mengakses artikel dan koleksi kamu.
          </p>

          {errorMsg && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-800 leading-relaxed">
              {errorMsg}
            </div>
          )}

          {/* Opsi 1: Email atau Google (Direct SSO Litera Cloud) */}
          <button
            onClick={handleEmailGoogleLogin}
            type="button"
            className="group relative w-full flex items-center justify-between overflow-hidden rounded-2xl border border-[#d07954]/50 bg-[#fff8f4] p-4.5 text-left transition-all duration-150 active:scale-98 hover:border-[#d07954] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d07954]"
          >
            <div className="flex-1 min-w-0 pr-2">
              <span className="block text-[0.95rem] font-[700] text-gray-900">
                Email atau Google
              </span>
              <p className="text-[0.8rem] text-gray-500 mt-0.5 truncate">
                Dompet Polygon dibuat otomatis
              </p>
            </div>
            <span className="text-xl text-[#b86644] transition-transform group-hover:translate-x-1">
              ↗
            </span>
          </button>

          {/* Opsi 2: Hubungkan Dompet Web3 -> Injected langsung bila ada, atau Web3Modal AppKit */}
          <button
            onClick={handleConnectWallet}
            type="button"
            className="group relative mt-3 w-full flex items-center justify-between overflow-hidden rounded-2xl border border-gray-200 bg-white p-4.5 text-left transition-all duration-150 active:scale-98 hover:border-gray-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d07954]"
          >
            <div className="flex-1 min-w-0 pr-2">
              <span className="block text-[0.95rem] font-[700] text-gray-900">
                Hubungkan Dompet
              </span>
              <p className="text-[0.8rem] text-gray-500 mt-0.5 truncate">
                MetaMask, Trust, Coinbase, dll.
              </p>
            </div>
            <span className="text-xl text-gray-400 transition-transform group-hover:translate-x-1">
              ↗
            </span>
          </button>

          {walletListBlocked && (
            <p className="mt-2 px-1 text-[11px] font-medium text-amber-800 leading-snug">
              Daftar dompet lambat dimuat — bila dialog tidak muncul, gunakan
              opsi Email atau Google.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="relative z-[1] flex items-center justify-between border-t border-gray-100 bg-slate-950/[0.02] px-7 py-3.5">
          <span className="text-[0.75rem] font-medium text-gray-500">
            Powered by Litera
          </span>
        </div>
      </div>
    </div>
  );
}
