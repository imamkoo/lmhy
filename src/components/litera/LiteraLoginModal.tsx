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
  const popupRef = useRef<Window | null>(null);

  const LITERA_ORIGIN = process.env.NEXT_PUBLIC_LITERA_DASHBOARD_URL || "https://literaa.xyz";

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

  // Handler 2: Hubungkan Dompet Web3 (Rabby Wallet, MetaMask, Injected Browser Wallet)
  const handleConnectWallet = async () => {
    setErrorMsg(null);
    setIsConnectingWallet(true);

    const win = typeof window !== "undefined" ? (window as unknown as { ethereum?: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> } }) : {};

    if (win.ethereum && typeof win.ethereum.request === "function") {
      try {
        // 1. Minta akses akun
        const accounts = (await win.ethereum.request({ method: "eth_requestAccounts" })) as string[];
        if (!accounts || !accounts[0] || !EVM_ADDRESS_REGEX.test(accounts[0])) {
          setErrorMsg("Gagal membaca alamat akun dari dompet.");
          setIsConnectingWallet(false);
          return;
        }

        const selectedAddress = accounts[0];

        // 2. Minta otomatis beralih ke Polygon Mainnet (137) jika perlu
        try {
          await win.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: POLYGON_CHAIN_ID_HEX }],
          });
        } catch (switchErr: unknown) {
          const errCode = (switchErr as { code?: number })?.code;
          // Kode 4902: Chain belum ditambahkan di dompet pengguna -> tambahkan Polygon
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
              // Jika ditolak menambah chain, tetap lanjutkan dengan alamat yang didapat
            }
          }
        }

        onSuccess(selectedAddress, "Web3 Wallet (Rabby / MetaMask)");
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
      // Tidak ada window.ethereum (misal di browser mobile biasa)
      const ua = typeof navigator !== "undefined" ? navigator.userAgent.toLowerCase() : "";
      const isMobile = /android|iphone|ipad|ipod|mobile/i.test(ua);

      if (isMobile) {
        // Sediakan petunjuk & tautan deep-link langsung ke browser Rabby/MetaMask
        const currentUrl = typeof window !== "undefined" ? window.location.href : "https://letmehearyou.id/builder";
        const cleanDappUrl = currentUrl.replace(/^https?:\/\//, "");
        const metamaskDeepLink = `https://metamask.app.link/dapp/${cleanDappUrl}`;

        setErrorMsg(
          "Dompet Web3 tidak terdeteksi di browser ini. Jika menggunakan HP, silakan gunakan opsi Email/Google di atas atau buka situs ini di dalam peramban aplikasi Rabby/MetaMask."
        );
        // Buka deep link ke MetaMask mobile sebagai fallback
        window.location.href = metamaskDeepLink;
      } else {
        setErrorMsg(
          "Ekstensi dompet (Rabby Wallet / MetaMask) tidak terdeteksi di peramban ini. Silakan pasang ekstensi dompet atau gunakan opsi Email/Google."
        );
      }
      setIsConnectingWallet(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Pilih cara masuk ke Litera"
        className="relative w-full max-w-[390px] overflow-hidden rounded-[24px] border border-white/70 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.3),0_0_70px_rgba(208,121,84,0.2)] backdrop-blur-xl animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative z-[1] p-7 pb-5">
          {/* Tombol Tutup */}
          <button
            type="button"
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-full transition-colors cursor-pointer"
            onClick={onClose}
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
            onClick={handleConnectWallet}
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
      </div>
    </div>
  );
}
