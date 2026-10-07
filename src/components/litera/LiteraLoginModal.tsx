"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface LiteraLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (walletAddress: string, method: string) => void;
}

const EVM_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;
const POLYGON_CHAIN_ID_HEX = "0x89"; // 137 in hex

export function LiteraLoginModal({ isOpen, onClose, onSuccess }: LiteraLoginModalProps) {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);
  const [showWalletChoice, setShowWalletChoice] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const popupRef = useRef<Window | null>(null);

  const LITERA_ORIGIN = process.env.NEXT_PUBLIC_LITERA_DASHBOARD_URL || "https://literaa.xyz";

  const handleClose = useCallback(() => {
    setShowWalletChoice(false);
    setCopiedLink(false);
    setErrorMsg(null);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    // Listener menerima pesan postMessage dari Litera /widget-auth popup saat login Email/Google
    const handleAuthMessage = (event: MessageEvent) => {
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
          return;
        }

        // Validasi format alamat EVM
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

  // Handler 1: Login via Litera Cloud (Email atau Google via Privy)
  const handleEmailGoogleLogin = () => {
    setErrorMsg(null);

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

    const ua = typeof navigator !== "undefined" ? navigator.userAgent.toLowerCase() : "";
    const isMobile =
      /android|iphone|ipad|ipod|mobile/i.test(ua) ||
      (typeof window !== "undefined" && window.innerWidth < 640);

    if (isMobile) {
      window.location.href = authUrl;
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
      window.location.href = authUrl;
      return;
    }

    popupRef.current = popup;
    popup.focus();
  };

  // Handler Request Akun via Injected Web3 Provider
  const connectInjectedProvider = async () => {
    setErrorMsg(null);
    setIsConnectingWallet(true);

    const win = typeof window !== "undefined" ? (window as unknown as { ethereum?: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> } }) : {};

    if (win.ethereum && typeof win.ethereum.request === "function") {
      try {
        const accounts = (await win.ethereum.request({ method: "eth_requestAccounts" })) as string[];
        if (!accounts || !accounts[0] || !EVM_ADDRESS_REGEX.test(accounts[0])) {
          setErrorMsg("Gagal membaca alamat akun dari dompet.");
          setIsConnectingWallet(false);
          return;
        }

        const selectedAddress = accounts[0];

        try {
          await win.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: POLYGON_CHAIN_ID_HEX }],
          });
        } catch (switchErr: unknown) {
          const errCode = (switchErr as { code?: number })?.code;
          if (errCode === 4902) {
            try {
              await win.ethereum.request({
                method: "wallet_addEthereumChain",
                params: [
                  {
                    chainId: POLYGON_CHAIN_ID_HEX,
                    chainName: "Polygon Mainnet",
                    nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
                    rpcUrls: ["https://polygon-bor-rpc.publicnode.com", "https://polygon-rpc.com"],
                    blockExplorerUrls: ["https://polygonscan.com/"],
                  },
                ],
              });
            } catch {
              // ignore
            }
          }
        }

        onSuccess(selectedAddress, "Web3 Wallet (EVM / Polygon)");
        handleClose();
      } catch (err: unknown) {
        const message = (err as { message?: string })?.message;
        if (message && message.toLowerCase().includes("reject")) {
          setErrorMsg("Koneksi dompet dibatalkan oleh pengguna.");
        } else {
          setErrorMsg(message || "Gagal menghubungkan dompet Web3.");
        }
      } finally {
        setIsConnectingWallet(false);
      }
    } else {
      setShowWalletChoice(true);
      setIsConnectingWallet(false);
    }
  };

  // Handler Klik Tombol "Hubungkan Dompet" dari View 1
  const handleConnectWalletClick = () => {
    const win = typeof window !== "undefined" ? (window as unknown as { ethereum?: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> } }) : {};
    if (win.ethereum && typeof win.ethereum.request === "function") {
      connectInjectedProvider();
    } else {
      setShowWalletChoice(true);
    }
  };

  // Handler Klik Tombol MetaMask di View 2
  const handleMetaMaskClick = () => {
    const win = typeof window !== "undefined" ? (window as unknown as { ethereum?: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> } }) : {};
    if (win.ethereum && typeof win.ethereum.request === "function") {
      connectInjectedProvider();
    } else {
      const currentUrl = typeof window !== "undefined" ? window.location.href : "https://letmehearyou.id/builder";
      const cleanDappUrl = currentUrl.replace(/^https?:\/\//, "");
      window.location.href = `https://metamask.app.link/dapp/${cleanDappUrl}`;
    }
  };

  // Salin Link URL Studio untuk DApps Browser
  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      const currentUrl = window.location.href;
      navigator.clipboard.writeText(currentUrl).then(() => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 3000);
      });
    }
  };

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={showWalletChoice ? "Connect a Wallet" : "Pilih cara masuk ke Litera"}
        className="relative w-full sm:max-w-[400px] overflow-hidden rounded-t-[32px] sm:rounded-[28px] border border-white/70 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.3),0_0_70px_rgba(208,121,84,0.2)] backdrop-blur-xl animate-in slide-in-from-bottom-6 sm:zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* VIEW 1: PILIHAN CARA MASUK UTAMA (Persis Dashboard Litera) */}
        {!showWalletChoice ? (
          <>
            <div className="relative z-[1] p-7 pb-5">
              {/* Tombol Tutup */}
              <button
                type="button"
                className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-full transition-colors cursor-pointer"
                onClick={handleClose}
                aria-label="Tutup jendela login"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>

              {/* Ikon Header Litera (Terracotta Gradient) */}
              <div className="relative mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#d07954]/30 bg-gradient-to-br from-[#d07954] via-[#c46748] to-[#7c3f31] shadow-[inset_0_1px_1px_rgba(255,255,255,0.55),0_12px_28px_rgba(208,121,84,0.35)]">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                  <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                  <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
                </svg>
              </div>

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

              {/* Opsi 1: Email atau Google */}
              <button
                onClick={handleEmailGoogleLogin}
                type="button"
                className="group relative w-full flex items-center gap-4 overflow-hidden rounded-2xl border border-[#d07954]/50 bg-gradient-to-r from-[#fff8f4] to-white p-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_8px_22px_rgba(208,121,84,0.1)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#d07954] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_14px_30px_rgba(208,121,84,0.2)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d07954]"
              >
                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#d07954] to-[#934833] shadow-[inset_0_1px_1px_rgba(255,255,255,0.45),0_6px_14px_rgba(208,121,84,0.35)]">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block text-[0.95rem] font-[700] text-gray-900">Email atau Google</span>
                  <p className="text-[0.8rem] text-gray-500 mt-0.5 truncate">
                    Dompet Polygon dibuat otomatis.
                  </p>
                </div>
                <span className="text-xl text-[#b86644] transition-transform group-hover:translate-x-1">↗</span>
              </button>

              {/* Opsi 2: Hubungkan Dompet */}
              <button
                onClick={handleConnectWalletClick}
                disabled={isConnectingWallet}
                type="button"
                className="group relative mt-3 w-full flex items-center gap-4 overflow-hidden rounded-2xl border border-gray-200 bg-white/90 p-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-[0_12px_26px_rgba(15,23,42,0.1)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d07954] disabled:opacity-60"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-950 to-slate-700 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_6px_14px_rgba(15,23,42,0.25)]">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block text-[0.95rem] font-[700] text-gray-900">Hubungkan Dompet</span>
                  <p className="text-[0.8rem] text-gray-500 mt-0.5 truncate">
                    {isConnectingWallet ? "Menghubungkan..." : "MetaMask, Rabby, atau Web3 Wallet."}
                  </p>
                </div>
                <span className="text-xl text-gray-400 transition-transform group-hover:translate-x-1">↗</span>
              </button>
            </div>

            {/* Footer */}
            <div className="relative z-[1] flex items-center gap-2 border-t border-gray-100 bg-slate-950/[0.03] px-7 py-3.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b86644" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span className="text-[0.75rem] font-medium text-gray-500">
                Powered by Litera
              </span>
            </div>
          </>
        ) : (
          /* VIEW 2: CONNECT A WALLET (100% PERSIS RAINBOWKIT DI IMAGE 1) */
          <div className="relative z-[1] px-6 pt-6 pb-8">
            {/* Header: Judul Tengah & Tombol Silang */}
            <div className="relative flex items-center justify-center mb-6">
              <h3 className="text-[1.3rem] font-[800] text-gray-900 tracking-tight">
                Connect a Wallet
              </h3>
              <button
                type="button"
                className="absolute right-0 w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-full transition-colors cursor-pointer"
                onClick={handleClose}
                aria-label="Tutup"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Horizontal Scrollable Wallet Icons List */}
            <div className="flex items-center gap-3 overflow-x-auto pb-4 no-scrollbar -mx-2 px-2 scroll-smooth">
              {/* 1. MetaMask */}
              <button
                type="button"
                onClick={handleMetaMaskClick}
                className="flex flex-col items-center justify-center min-w-[76px] p-2 rounded-2xl hover:bg-gray-50 transition-colors group cursor-pointer shrink-0"
              >
                <div className="w-[62px] h-[62px] rounded-[22px] bg-white border border-gray-100 shadow-[0_4px_16px_rgba(0,0,0,0.06)] flex items-center justify-center p-2 mb-2 group-hover:scale-105 transition-transform">
                  <svg viewBox="0 0 318.6 318.6" width="40" height="40">
                    <polygon fill="#E2761B" stroke="#E2761B" strokeWidth="1" points="274.1 35.5 174.6 109.4 193 65.8" />
                    <polygon fill="#E4761B" stroke="#E4761B" strokeWidth="1" points="44.4 35.5 143.1 110.1 125.6 65.8" />
                    <polygon fill="#E4761B" stroke="#E4761B" strokeWidth="1" points="238.3 206.8 211.8 247.4 268.5 263 284.8 207.7" />
                    <polygon fill="#E4761B" stroke="#E4761B" strokeWidth="1" points="33.9 207.7 50.1 263 106.8 247.4 80.3 206.8" />
                    <polygon fill="#E4761B" stroke="#E4761B" strokeWidth="1" points="103.6 138.2 87.8 162.1 144.1 164.6 142.1 104.1" />
                    <polygon fill="#E4761B" stroke="#E4761B" strokeWidth="1" points="214.9 138.2 175.9 103.4 174.6 164.6 230.8 162.1" />
                    <polygon fill="#E4761B" stroke="#E4761B" strokeWidth="1" points="106.8 247.4 140.6 230.9 111.4 208.1" />
                    <polygon fill="#E4761B" stroke="#E4761B" strokeWidth="1" points="177.9 230.9 211.8 247.4 207.1 208.1" />
                    <polygon fill="#D7C1B3" stroke="#D7C1B3" strokeWidth="1" points="211.8 247.4 177.9 230.9 180.6 253 180.3 262.3" />
                    <polygon fill="#D7C1B3" stroke="#D7C1B3" strokeWidth="1" points="106.8 247.4 138.3 262.3 137.9 253 140.6 230.9" />
                    <polygon fill="#233447" stroke="#233447" strokeWidth="1" points="138.8 193.5 110.6 185.2 130.5 176.1" />
                    <polygon fill="#233447" stroke="#233447" strokeWidth="1" points="179.7 193.5 188 176.1 208 185.2" />
                    <polygon fill="#CD6116" stroke="#CD6116" strokeWidth="1" points="106.8 247.4 111.6 206.8 80.3 207.5" />
                    <polygon fill="#CD6116" stroke="#CD6116" strokeWidth="1" points="207 206.8 211.8 247.4 238.3 207.5" />
                    <polygon fill="#CD6116" stroke="#CD6116" strokeWidth="1" points="230.8 162.1 174.6 164.6 179.8 193.5 188.1 176.1 208.1 185.2 238.3 207.5 284.8 207.7" />
                    <polygon fill="#CD6116" stroke="#CD6116" strokeWidth="1" points="33.9 207.7 80.3 207.5 110.5 185.2 130.5 176.1 138.8 193.5 144.1 164.6 87.8 162.1" />
                    <polygon fill="#E4751F" stroke="#E4751F" strokeWidth="1" points="87.8 162.1 144.1 164.6 138.8 193.5 130.5 176.1 110.5 185.2" />
                    <polygon fill="#E4751F" stroke="#E4751F" strokeWidth="1" points="230.8 162.1 208.1 185.2 188.1 176.1 179.8 193.5 174.6 164.6" />
                    <polygon fill="#F6851B" stroke="#F6851B" strokeWidth="1" points="87.8 162.1 33.9 207.7 80.3 207.5" />
                    <polygon fill="#F6851B" stroke="#F6851B" strokeWidth="1" points="284.8 207.7 230.8 162.1 238.3 207.5" />
                    <polygon fill="#C0AD9E" stroke="#C0AD9E" strokeWidth="1" points="177.9 230.9 140.6 230.9 138.8 193.5 144.1 164.6 174.6 164.6 179.8 193.5" />
                    <polygon fill="#161616" stroke="#161616" strokeWidth="1" points="177.9 230.9 180.6 253 137.9 253 140.6 230.9" />
                    <polygon fill="#763D16" stroke="#763D16" strokeWidth="1" points="274.1 35.5 284.8 207.7 238.3 206.8 230.8 162.1 214.9 138.2 175.9 103.4 174.6 109.4" />
                    <polygon fill="#763D16" stroke="#763D16" strokeWidth="1" points="44.4 35.5 143.1 110.1 142.1 104.1 103.6 138.2 87.8 162.1 80.3 206.8 33.9 207.7" />
                    <polygon fill="#F6851B" stroke="#F6851B" strokeWidth="1" points="175.9 103.4 214.9 138.2 174.6 164.6" />
                    <polygon fill="#F6851B" stroke="#F6851B" strokeWidth="1" points="142.1 104.1 144.1 164.6 103.6 138.2" />
                  </svg>
                </div>
                <span className="text-[12px] font-[600] text-gray-800 text-center leading-tight">MetaMask</span>
              </button>

              {/* 2. Bitget Wallet */}
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex flex-col items-center justify-center min-w-[76px] p-2 rounded-2xl hover:bg-gray-50 transition-colors group cursor-pointer shrink-0"
              >
                <div className="w-[62px] h-[62px] rounded-[22px] bg-[#000000] flex items-center justify-center p-2 mb-2 group-hover:scale-105 transition-transform shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
                  <svg width="34" height="34" viewBox="0 0 48 48" fill="none">
                    <rect width="48" height="48" rx="12" fill="#00F0FF" />
                    <path d="M14 24L26 12L34 20L22 32L14 24Z" fill="black" />
                    <path d="M22 32L26 36L34 28L30 24L22 32Z" fill="black" opacity="0.7" />
                  </svg>
                </div>
                <span className="text-[12px] font-[600] text-gray-800 text-center leading-tight">Bitget<br />Wallet</span>
              </button>

              {/* 3. WalletConnect */}
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex flex-col items-center justify-center min-w-[76px] p-2 rounded-2xl hover:bg-gray-50 transition-colors group cursor-pointer shrink-0"
              >
                <div className="w-[62px] h-[62px] rounded-[22px] bg-[#3B99FC] flex items-center justify-center p-2 mb-2 group-hover:scale-105 transition-transform shadow-[0_4px_16px_rgba(59,153,252,0.25)]">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                    <path d="M5.4 8.7C8.9 5.2 15.1 5.2 18.6 8.7L19.2 9.3C19.5 9.6 19.5 10 19.2 10.3L17.7 11.8C17.5 12 17.2 12 17 11.8L16.2 11C13.8 8.6 10.2 8.6 7.8 11L6.9 11.9C6.7 12.1 6.4 12.1 6.2 11.9L4.7 10.4C4.4 10.1 4.4 9.7 4.7 9.4L5.4 8.7ZM21.9 12L23.7 13.8C24 14.1 24 14.5 23.7 14.8L16.1 22.4C15.8 22.7 15.4 22.7 15.1 22.4L12 19.3L8.9 22.4C8.6 22.7 8.2 22.7 7.9 22.4L0.3 14.8C0 14.5 0 14.1 0.3 13.8L2.1 12C2.4 11.7 2.8 11.7 3.1 12L6.2 15.1L9.3 12C9.6 11.7 10 11.7 10.3 12L12 13.7L13.7 12C14 11.7 14.4 11.7 14.7 12L17.8 15.1L20.9 12C21.2 11.7 21.6 11.7 21.9 12Z" fill="white" />
                  </svg>
                </div>
                <span className="text-[12px] font-[600] text-gray-800 text-center leading-tight">WalletConnect</span>
              </button>

              {/* 4. Trust Wallet */}
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex flex-col items-center justify-center min-w-[76px] p-2 rounded-2xl hover:bg-gray-50 transition-colors group cursor-pointer shrink-0"
              >
                <div className="w-[62px] h-[62px] rounded-[22px] bg-white border border-gray-100 shadow-[0_4px_16px_rgba(0,0,0,0.06)] flex items-center justify-center p-2 mb-2 group-hover:scale-105 transition-transform">
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L3 6V12C3 17.5 6.8 22.7 12 24C17.2 22.7 21 17.5 21 12V6L12 2Z" fill="url(#trust_grad)" />
                    <defs>
                      <linearGradient id="trust_grad" x1="3" y1="2" x2="21" y2="24" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#0500FF" />
                        <stop offset="1" stopColor="#00E0FF" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                <span className="text-[12px] font-[600] text-gray-800 text-center leading-tight">Trust<br />Wallet</span>
              </button>

              {/* 5. Coinbase Wallet */}
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex flex-col items-center justify-center min-w-[76px] p-2 rounded-2xl hover:bg-gray-50 transition-colors group cursor-pointer shrink-0"
              >
                <div className="w-[62px] h-[62px] rounded-[22px] bg-[#0052FF] flex items-center justify-center p-2 mb-2 group-hover:scale-105 transition-transform shadow-[0_4px_16px_rgba(0,82,255,0.25)]">
                  <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#0052FF]" />
                  </div>
                </div>
                <span className="text-[12px] font-[600] text-gray-800 text-center leading-tight">Coinbase</span>
              </button>
            </div>

            {/* What is a Wallet Section (Persis Image 1) */}
            <div className="pt-6 text-center">
              <h4 className="text-[1.1rem] font-[800] text-gray-900 mb-2.5">
                What is a Wallet?
              </h4>
              <p className="text-[0.85rem] text-gray-500 leading-relaxed max-w-[340px] mx-auto mb-6">
                A wallet is used to send, receive, store, and display digital assets. It&apos;s also a new way to log in, without needing to create new accounts and passwords on every website.
              </p>

              {/* Action Buttons: Get a Wallet & Learn More */}
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleMetaMaskClick}
                  className="flex-1 py-3 px-5 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-[14px] font-[700] text-[#c46748] transition-colors shadow-xs cursor-pointer"
                >
                  Get a Wallet
                </button>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex-1 py-3 px-5 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-[14px] font-[700] text-[#c46748] transition-colors shadow-xs cursor-pointer"
                >
                  {copiedLink ? "Link Disalin!" : "Learn More"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
