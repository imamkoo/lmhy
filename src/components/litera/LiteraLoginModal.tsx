"use client";

import { useState, useEffect, useRef } from "react";

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

  const handleClose = () => {
    setShowWalletChoice(false);
    setCopiedLink(false);
    setErrorMsg(null);
    onClose();
  };

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
        onClose();
      }
    };

    window.addEventListener("message", handleAuthMessage);
    return () => {
      window.removeEventListener("message", handleAuthMessage);
    };
  }, [isOpen, onClose, onSuccess]);

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
        onClose();
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

  // Handler Klik Tombol "Hubungkan Dompet"
  const handleConnectWalletClick = () => {
    const win = typeof window !== "undefined" ? (window as unknown as { ethereum?: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> } }) : {};
    if (win.ethereum && typeof win.ethereum.request === "function") {
      connectInjectedProvider();
    } else {
      // Browser biasa (Chrome / Safari HP tanpa provider Web3) -> Tampilkan view "Connect a Wallet"
      setShowWalletChoice(true);
    }
  };

  // Salin Link URL Studio untuk DApps Browser (Rabby / MetaMask)
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
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={showWalletChoice ? "Connect a Wallet" : "Pilih cara masuk ke Litera"}
        className="relative w-full max-w-[390px] overflow-hidden rounded-[24px] border border-white/70 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.3),0_0_70px_rgba(208,121,84,0.2)] backdrop-blur-xl animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* VIEW 1: PILIHAN CARA MASUK UTAMA (Persis Dashboard Litera) */}
        {!showWalletChoice ? (
          <>
            <div className="relative z-[1] p-7 pb-5">
              {/* Tombol Tutup */}
              <button
                type="button"
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-full transition-colors cursor-pointer"
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
                    {isConnectingWallet ? "Menghubungkan..." : "Rabby, MetaMask, atau Web3 Wallet."}
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
          /* VIEW 2: CONNECT A WALLET (Persis Tampilan RainbowKit Mobile Litera) */
          <>
            <div className="relative z-[1] p-6 pb-5">
              {/* Tombol Kembali & Tutup */}
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={() => setShowWalletChoice(false)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 cursor-pointer"
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
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <h3 className="text-center text-[1.25rem] font-[800] text-gray-900 tracking-tight mb-5">
                Connect a Wallet
              </h3>

              {/* Grid Ikon Dompet Web3 Persis RainbowKit */}
              <div className="grid grid-cols-4 gap-2 mb-6">
                {/* 1. Rabby Wallet */}
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex flex-col items-center justify-center p-2.5 rounded-2xl hover:bg-gray-50 transition-colors group cursor-pointer"
                >
                  <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#7085FF] to-[#3950DE] flex items-center justify-center shadow-md mb-2 group-hover:scale-105 transition-transform">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                      <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
                    </svg>
                  </div>
                  <span className="text-[11px] font-bold text-gray-800 text-center leading-tight">Rabby</span>
                </button>

                {/* 2. MetaMask */}
                <button
                  type="button"
                  onClick={() => {
                    const currentUrl = typeof window !== "undefined" ? window.location.href : "https://letmehearyou.id/builder";
                    const cleanDappUrl = currentUrl.replace(/^https?:\/\//, "");
                    window.location.href = `https://metamask.app.link/dapp/${cleanDappUrl}`;
                  }}
                  className="flex flex-col items-center justify-center p-2.5 rounded-2xl hover:bg-gray-50 transition-colors group cursor-pointer"
                >
                  <div className="w-13 h-13 rounded-2xl bg-[#f6851b]/10 border border-[#f6851b]/30 flex items-center justify-center shadow-sm mb-2 group-hover:scale-105 transition-transform">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e2761b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 2 7 12 12 22 7 12 2" />
                      <polyline points="2 17 12 22 22 17" />
                      <polyline points="2 12 12 17 22 12" />
                    </svg>
                  </div>
                  <span className="text-[11px] font-bold text-gray-800 text-center leading-tight">MetaMask</span>
                </button>

                {/* 3. WalletConnect / Salin Link */}
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex flex-col items-center justify-center p-2.5 rounded-2xl hover:bg-gray-50 transition-colors group cursor-pointer"
                >
                  <div className="w-13 h-13 rounded-2xl bg-[#3B99FC]/15 border border-[#3B99FC]/30 flex items-center justify-center shadow-sm mb-2 group-hover:scale-105 transition-transform">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B99FC" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 8l4 4-4 4" />
                      <path d="M20 8l-4 4 4 4" />
                    </svg>
                  </div>
                  <span className="text-[11px] font-bold text-gray-800 text-center leading-tight">DApp Link</span>
                </button>

                {/* 4. Litera Cloud */}
                <button
                  type="button"
                  onClick={handleEmailGoogleLogin}
                  className="flex flex-col items-center justify-center p-2.5 rounded-2xl hover:bg-gray-50 transition-colors group cursor-pointer"
                >
                  <div className="w-13 h-13 rounded-2xl bg-[#d07954]/15 border border-[#d07954]/30 flex items-center justify-center shadow-sm mb-2 group-hover:scale-105 transition-transform">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d07954" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    </svg>
                  </div>
                  <span className="text-[11px] font-bold text-gray-800 text-center leading-tight">Email/Google</span>
                </button>
              </div>

              {/* Petunjuk Membuka di Rabby / Dompet Mobile */}
              <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4 mb-4">
                <p className="text-[12px] font-bold text-blue-950 mb-1">
                  Cara menggunakan Rabby Wallet di HP:
                </p>
                <ol className="text-[11px] text-blue-800 space-y-1 list-decimal list-inside leading-relaxed">
                  <li>Klik tombol <strong>Salin Link Studio</strong> di bawah.</li>
                  <li>Buka aplikasi <strong>Rabby Wallet</strong> di HP Anda.</li>
                  <li>Pilih menu <strong>DApps</strong> di Rabby lalu tempel (paste) link ini.</li>
                </ol>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="mt-3 w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  {copiedLink ? "Link Studio Berhasil Disalin!" : "Salin Link Studio untuk Rabby"}
                </button>
              </div>

              {/* Informasi What is a Wallet */}
              <div className="pt-2 text-center border-t border-gray-100">
                <h4 className="text-[13px] font-bold text-gray-900 mb-1">What is a Wallet?</h4>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  A wallet is used to send, receive, store, and display digital assets. It&apos;s also a new way to log in without needing passwords.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
