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
  const [showWalletHelper, setShowWalletHelper] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const popupRef = useRef<Window | null>(null);

  const LITERA_ORIGIN = process.env.NEXT_PUBLIC_LITERA_DASHBOARD_URL || "https://literaa.xyz";

  const handleClose = useCallback(() => {
    setShowWalletHelper(false);
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
        const savedNonce = sessionStorage.getItem("litera_sso_nonce");
        if (data.state && savedNonce && data.state !== savedNonce) {
          setErrorMsg("Sesi autentikasi tidak valid atau telah kedaluwarsa. Silakan coba kembali.");
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

  // Handler Request Akun via Injected Web3 Provider (MetaMask / Rabby / Browser dApp)
  const connectInjectedProvider = async (walletName: string = "Web3 Wallet") => {
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

        onSuccess(selectedAddress, walletName);
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
      setShowWalletHelper(true);
      setIsConnectingWallet(false);
    }
  };

  // Handler Klik Tombol "Hubungkan Dompet"
  const handleConnectWalletClick = () => {
    const win = typeof window !== "undefined" ? (window as unknown as { ethereum?: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> } }) : {};
    if (win.ethereum && typeof win.ethereum.request === "function") {
      connectInjectedProvider("Web3 Wallet (MetaMask / Rabby)");
    } else {
      setShowWalletHelper(true);
    }
  };

  // Handler Klik Buka di MetaMask Mobile
  const handleOpenMetaMask = () => {
    const currentUrl = typeof window !== "undefined" ? window.location.href : "https://letmehearyou.id/builder";
    const cleanDappUrl = currentUrl.replace(/^https?:\/\//, "");
    window.location.href = `https://metamask.app.link/dapp/${cleanDappUrl}`;
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
        aria-label="Pilih cara masuk ke Litera"
        className="relative w-full sm:max-w-[400px] overflow-hidden rounded-t-[32px] sm:rounded-[28px] border border-white/70 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.3),0_0_70px_rgba(208,121,84,0.2)] backdrop-blur-xl animate-in slide-in-from-bottom-6 sm:zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* TAMPILAN UTAMA: MINIMALIS & BERSIH */}
        {!showWalletHelper ? (
          <>
            <div className="relative z-[1] p-7 pb-6">
              {/* Tombol Tutup */}
              <button
                type="button"
                className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-full transition-colors cursor-pointer"
                onClick={handleClose}
                aria-label="Tutup jendela login"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
                className="group relative w-full flex items-center justify-between overflow-hidden rounded-2xl border border-[#d07954]/50 bg-gradient-to-r from-[#fff8f4] to-white p-4.5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_8px_22px_rgba(208,121,84,0.1)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#d07954] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d07954]"
              >
                <div className="flex-1 min-w-0 pr-2">
                  <span className="block text-[0.95rem] font-[700] text-gray-900">Email atau Google</span>
                  <p className="text-[0.8rem] text-gray-500 mt-0.5 truncate">
                    Dompet Polygon dibuat otomatis
                  </p>
                </div>
                <span className="text-xl text-[#b86644] transition-transform group-hover:translate-x-1">↗</span>
              </button>

              {/* Opsi 2: Hubungkan Dompet Web3 (MetaMask / Rabby) */}
              <button
                onClick={handleConnectWalletClick}
                disabled={isConnectingWallet}
                type="button"
                className="group relative mt-3 w-full flex items-center justify-between overflow-hidden rounded-2xl border border-gray-200 bg-white p-4.5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-[0_12px_26px_rgba(15,23,42,0.08)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d07954] disabled:opacity-60"
              >
                <div className="flex-1 min-w-0 pr-2">
                  <span className="block text-[0.95rem] font-[700] text-gray-900">Hubungkan Dompet</span>
                  <p className="text-[0.8rem] text-gray-500 mt-0.5 truncate">
                    {isConnectingWallet ? "Menghubungkan..." : "MetaMask, Rabby, atau Web3 Wallet"}
                  </p>
                </div>
                <span className="text-xl text-gray-400 transition-transform group-hover:translate-x-1">↗</span>
              </button>
            </div>

            {/* Footer */}
            <div className="relative z-[1] flex items-center justify-between border-t border-gray-100 bg-slate-950/[0.02] px-7 py-3.5">
              <span className="text-[0.75rem] font-medium text-gray-500">
                Powered by Litera
              </span>
            </div>
          </>
        ) : (
          /* TAMPILAN BANTUAN DOMPET MOBILE: MINIMALIS TEKS */
          <div className="relative z-[1] p-6 pb-7">
            {/* Header: Tombol Kembali & Tutup */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={() => setShowWalletHelper(false)}
                className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-gray-900 cursor-pointer"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
                Kembali
              </button>
              <button
                type="button"
                className="w-7 h-7 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-full transition-colors cursor-pointer"
                onClick={handleClose}
                aria-label="Tutup"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <h3 className="text-[1.25rem] font-[800] text-gray-900 tracking-tight mb-2">
              Koneksi Dompet di HP
            </h3>
            <p className="text-[0.82rem] text-gray-500 mb-5 leading-relaxed">
              Browser HP biasa tidak memiliki ekstensi Web3. Silakan pilih metode koneksi di bawah:
            </p>

            <div className="space-y-3 mb-5">
              {/* Opsi A: Buka di Aplikasi MetaMask (Teks Minimalis) */}
              <button
                type="button"
                onClick={handleOpenMetaMask}
                className="w-full flex items-center justify-between p-4 rounded-2xl border border-gray-200 bg-white hover:border-[#E2761B] hover:bg-orange-50/30 transition-all cursor-pointer text-left group"
              >
                <div className="flex-1 min-w-0 pr-2">
                  <span className="block text-[0.95rem] font-[700] text-gray-900 leading-tight">
                    Buka di Aplikasi MetaMask
                  </span>
                  <span className="block text-[0.8rem] text-gray-500 mt-1">
                    Buka studio langsung di dApp browser MetaMask
                  </span>
                </div>
                <span className="text-xl text-[#E2761B] transition-transform group-hover:translate-x-1">↗</span>
              </button>

              {/* Opsi B: Gunakan Email atau Google (Teks Minimalis) */}
              <button
                type="button"
                onClick={handleEmailGoogleLogin}
                className="w-full flex items-center justify-between p-4 rounded-2xl border border-gray-200 bg-white hover:border-[#d07954] hover:bg-orange-50/30 transition-all cursor-pointer text-left group"
              >
                <div className="flex-1 min-w-0 pr-2">
                  <span className="block text-[0.95rem] font-[700] text-gray-900 leading-tight">
                    Masuk dengan Email / Google
                  </span>
                  <span className="block text-[0.8rem] text-gray-500 mt-1">
                    Instan di Chrome/Safari HP (tanpa install app)
                  </span>
                </div>
                <span className="text-xl text-[#b86644] transition-transform group-hover:translate-x-1">↗</span>
              </button>
            </div>

            {/* Tombol Salin Link (Minimalis) */}
            <button
              type="button"
              onClick={handleCopyLink}
              className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition-all active:scale-98 flex items-center justify-center cursor-pointer"
            >
              {copiedLink ? "Link Studio Berhasil Disalin!" : "Salin Link Studio"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
