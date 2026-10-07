"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";

interface LiteraLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (walletAddress: string, method: string) => void;
}

interface WalletListing {
  id: string;
  name: string;
  image_url: {
    lg?: string;
    md?: string;
    sm?: string;
  };
  mobile?: {
    native?: string | null;
    universal?: string | null;
  };
  injected?: Array<{ injected_id: string; namespace: string }> | null;
  homepage?: string;
}

const EVM_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;
const POLYGON_CHAIN_ID_HEX = "0x89"; // 137 in hex
const WALLETCONNECT_PROJECT_ID = "d94f04faafa515ac177c9c41052264b7";

// Fallback kurasi dompet populer resmi dari WalletConnect Explorer
const INITIAL_WALLETS: WalletListing[] = [
  {
    id: "c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96",
    name: "MetaMask",
    image_url: {
      md: "https://explorer-api.walletconnect.com/v3/logo/md/eebe4a7f-7166-402f-92e0-1f64ca2aa800?projectId=d94f04faafa515ac177c9c41052264b7",
    },
    mobile: {
      universal: "https://metamask.app.link",
      native: "metamask://",
    },
  },
  {
    id: "4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0",
    name: "Trust Wallet",
    image_url: {
      md: "https://explorer-api.walletconnect.com/v3/logo/md/7677b54f-3486-46e2-4e37-bf8747814f00?projectId=d94f04faafa515ac177c9c41052264b7",
    },
    mobile: {
      universal: "https://link.trustwallet.com",
      native: "trust://",
    },
  },
  {
    id: "8a0ee50d1f22f6651afcae7eb4253e52a3310b90af5daef78a8c4929a9bb99d4",
    name: "Binance Wallet",
    image_url: {
      md: "https://explorer-api.walletconnect.com/v3/logo/md/ebac7b39-688c-41e3-7912-a4fefba74600?projectId=d94f04faafa515ac177c9c41052264b7",
    },
    mobile: {
      universal: "https://app.binance.com/cedefi",
      native: "bnc://app.binance.com/cedefi/",
    },
  },
  {
    id: "0b415a746fb9ee99cce155c2ceca0c6f6061b1dbca2d722b3ba16381d0562150",
    name: "SafePal",
    image_url: {
      md: "https://explorer-api.walletconnect.com/v3/logo/md/252753e7-b783-4e03-7f77-d39864530900?projectId=d94f04faafa515ac177c9c41052264b7",
    },
    mobile: {
      universal: "https://link.safepal.io",
      native: "safepalwallet://",
    },
  },
  {
    id: "20459438007b75f4f4acb98bf29aa3b800550309646d375da5fd4aac6c2a2c66",
    name: "TokenPocket",
    image_url: {
      md: "https://explorer-api.walletconnect.com/v3/logo/md/cfe00608-cb9e-45e3-0d08-5ffc7f5ad200?projectId=d94f04faafa515ac177c9c41052264b7",
    },
    mobile: {
      native: "tpoutside://",
    },
  },
  {
    id: "38f5d18bd8522c244bdd70cb4a68e0e718865155811c043f052fb9f1c51de662",
    name: "Bitget Wallet",
    image_url: {
      md: "https://explorer-api.walletconnect.com/v3/logo/md/2b569b7f-e6c6-4faa-8e5a-ecd4dec8cf00?projectId=d94f04faafa515ac177c9c41052264b7",
    },
    mobile: {
      universal: "https://bkapp.vip",
      native: "bitkeep://",
    },
  },
  {
    id: "971e689d0a5be527bac79629b4ee9b925e82208e5168b733496a09c0faed0709",
    name: "OKX Wallet",
    image_url: {
      md: "https://explorer-api.walletconnect.com/v3/logo/md/45f2f08e-fc0c-4d62-3e63-404e72170500?projectId=d94f04faafa515ac177c9c41052264b7",
    },
    mobile: {
      native: "okex://main",
    },
  },
  {
    id: "c03dfee351b6fcc421b4494ea33b9d4b92a984f87aa76d1663bb28705e95034a",
    name: "Uniswap Wallet",
    image_url: {
      md: "https://explorer-api.walletconnect.com/v3/logo/md/bff9cf1f-df19-42ce-f62a-87f04df13c00?projectId=d94f04faafa515ac177c9c41052264b7",
    },
    mobile: {
      universal: "https://uniswap.org/app",
      native: "uniswap://",
    },
  },
  {
    id: "c286eebc742a537cd1d6818363e9dc53b21759a1e8e5d9b263d0c03ec7703576",
    name: "1inch Wallet",
    image_url: {
      md: "https://explorer-api.walletconnect.com/v3/logo/md/3e60118c-b9a9-43df-7975-33ebc8014400?projectId=d94f04faafa515ac177c9c41052264b7",
    },
    mobile: {
      universal: "https://wallet.1inch.io/app",
      native: "oneinch://",
    },
  },
  {
    id: "ecc4036f814562b41a5268adc86270fba1365471402006302e70169465b7ac18",
    name: "Zerion",
    image_url: {
      md: "https://explorer-api.walletconnect.com/v3/logo/md/73f6f52f-7862-49e7-bb85-ba93ab72cc00?projectId=d94f04faafa515ac177c9c41052264b7",
    },
    mobile: {
      universal: "https://wallet.zerion.io/wc",
      native: "zerion://",
    },
  },
  {
    id: "f2436c67184f158d1beda5df53298ee84abfc367581e4505134b5bcf5f46697d",
    name: "Crypto.com",
    image_url: {
      md: "https://explorer-api.walletconnect.com/v3/logo/md/88388eb4-4471-4e72-c4b4-852d496fea00?projectId=d94f04faafa515ac177c9c41052264b7",
    },
    mobile: {
      universal: "https://wallet.crypto.com/deeplink",
      native: "dfw://",
    },
  },
  {
    id: "19177a98252e07ddfc9af2083ba8e07ef627cb6103467ffebb3f8f4205fd7927",
    name: "Ledger",
    image_url: {
      md: "https://explorer-api.walletconnect.com/v3/logo/md/a7f416de-aa03-4c5e-3280-ab49269aef00?projectId=d94f04faafa515ac177c9c41052264b7",
    },
    mobile: {
      native: "ledgerlive://",
    },
  },
];

export function LiteraLoginModal({ isOpen, onClose, onSuccess }: LiteraLoginModalProps) {
  const [currentView, setCurrentView] = useState<"MAIN" | "ALL_WALLETS">("MAIN");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [wallets, setWallets] = useState<WalletListing[]>(INITIAL_WALLETS);
  const [isLoadingWallets, setIsLoadingWallets] = useState(false);
  const popupRef = useRef<Window | null>(null);

  const LITERA_ORIGIN = process.env.NEXT_PUBLIC_LITERA_DASHBOARD_URL || "https://literaa.xyz";

  const handleClose = useCallback(() => {
    setCurrentView("MAIN");
    setCopiedLink(false);
    setErrorMsg(null);
    setSearchQuery("");
    onClose();
  }, [onClose]);

  // Fetch real list from WalletConnect Explorer API on modal open
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchWalletConnectList = async () => {
      try {
        setIsLoadingWallets(true);
        const res = await fetch(
          `https://explorer-api.walletconnect.com/v3/wallets?projectId=${WALLETCONNECT_PROJECT_ID}&entries=48&page=1`
        );
        if (!res.ok) return;
        const data = await res.json();
        if (data && data.listings && isMounted) {
          const list: WalletListing[] = Object.values(data.listings);
          if (list.length > 0) {
            setWallets(list);
          }
        }
      } catch {
        // Gunakan INITIAL_WALLETS jika offline / error
      } finally {
        if (isMounted) setIsLoadingWallets(false);
      }
    };

    fetchWalletConnectList();
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Search filter
  const filteredWallets = useMemo(() => {
    if (!searchQuery.trim()) return wallets;
    const q = searchQuery.toLowerCase().trim();
    return wallets.filter((w) => w.name.toLowerCase().includes(q));
  }, [wallets, searchQuery]);

  // SSO Message Listener (Email / Google via Privy)
  useEffect(() => {
    if (!isOpen) return;

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

    const callbackUrl = typeof window !== "undefined" ? window.location.href : "https://letmehearyou.id/builder";
    const authUrl = `${LITERA_ORIGIN}/widget-auth?article=${encodeURIComponent(callbackUrl)}&state=${encodeURIComponent(nonce)}`;

    const ua = typeof navigator !== "undefined" ? navigator.userAgent.toLowerCase() : "";
    const isMobile =
      /android|iphone|ipad|ipod|mobile/i.test(ua) || (typeof window !== "undefined" && window.innerWidth < 640);

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

  // Handler: Request Akun via Injected Web3 Provider
  const connectInjectedProvider = async (walletName: string = "Web3 Wallet") => {
    setErrorMsg(null);
    setIsConnectingWallet(true);

    const win =
      typeof window !== "undefined"
        ? (window as unknown as { ethereum?: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> } })
        : {};

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
      setIsConnectingWallet(false);
      // Jika di desktop tanpa extension, tampilkan pesan
      setErrorMsg("Tidak ada ekstensi dompet Web3 yang terdeteksi di browser ini.");
    }
  };

  // Handler Klik Dompet Spesifik pada Grid All Wallets
  const handleSelectWallet = (wallet: WalletListing) => {
    setErrorMsg(null);
    const ua = typeof navigator !== "undefined" ? navigator.userAgent.toLowerCase() : "";
    const isMobile =
      /android|iphone|ipad|ipod|mobile/i.test(ua) || (typeof window !== "undefined" && window.innerWidth < 640);

    const win =
      typeof window !== "undefined"
        ? (window as unknown as { ethereum?: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> } })
        : {};

    // Jika di browser dApp atau desktop dengan ekstensi aktif
    if (win.ethereum && typeof win.ethereum.request === "function") {
      connectInjectedProvider(wallet.name);
      return;
    }

    // Jika di mobile biasa tanpa provider aktif
    if (isMobile) {
      const currentUrl = typeof window !== "undefined" ? window.location.href : "https://letmehearyou.id/builder";
      const cleanUrl = currentUrl.replace(/^https?:\/\//, "");

      // Deep link khusus dompet populer
      const lowerName = wallet.name.toLowerCase();
      if (lowerName.includes("metamask")) {
        window.location.assign(`https://metamask.app.link/dapp/${cleanUrl}`);
        return;
      }
      if (lowerName.includes("trust")) {
        window.location.assign(`https://link.trustwallet.com/open_url?coin_id=60&url=${encodeURIComponent(currentUrl)}`);
        return;
      }
      if (lowerName.includes("tokenpocket")) {
        window.location.assign(`tpoutside://open?url=${encodeURIComponent(currentUrl)}`);
        return;
      }
      if (lowerName.includes("bitget") || lowerName.includes("bitkeep")) {
        window.location.assign(`https://bkapp.vip/dapp?url=${encodeURIComponent(currentUrl)}`);
        return;
      }

      // Universal / Native fallback dari metadata WalletConnect
      if (wallet.mobile?.universal) {
        window.location.assign(`${wallet.mobile.universal}/dapp/${cleanUrl}`);
        return;
      }
      if (wallet.mobile?.native) {
        window.location.assign(`${wallet.mobile.native}dapp/${cleanUrl}`);
        return;
      }

      // Jika tidak ada deep link spesifik, salin URL dan beri instruksi
      handleCopyLink();
      setErrorMsg(`Link studio disalin. Silakan buka aplikasi ${wallet.name} dan tempel di dApp Browser.`);
      return;
    }

    // Di Desktop tanpa provider
    connectInjectedProvider(wallet.name);
  };

  // Salin Link URL Studio
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
        aria-label="Autentikasi Litera"
        className="relative w-full sm:max-w-[420px] max-h-[85vh] flex flex-col overflow-hidden rounded-t-[32px] sm:rounded-[28px] border border-white/70 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.3),0_0_70px_rgba(208,121,84,0.2)] backdrop-blur-xl animate-in slide-in-from-bottom-6 sm:zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ========================================================
            VIEW 1: MASUK KE LITERA (2 PILIHAN UTAMA)
            ======================================================== */}
        {currentView === "MAIN" && (
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

              {/* Opsi 2: Hubungkan Dompet Web3 -> Langsung Buka View All Wallets */}
              <button
                onClick={() => {
                  setErrorMsg(null);
                  setCurrentView("ALL_WALLETS");
                }}
                disabled={isConnectingWallet}
                type="button"
                className="group relative mt-3 w-full flex items-center justify-between overflow-hidden rounded-2xl border border-gray-200 bg-white p-4.5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-[0_12px_26px_rgba(15,23,42,0.08)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d07954] disabled:opacity-60"
              >
                <div className="flex-1 min-w-0 pr-2">
                  <span className="block text-[0.95rem] font-[700] text-gray-900">Hubungkan Dompet</span>
                  <p className="text-[0.8rem] text-gray-500 mt-0.5 truncate">
                    MetaMask, Trust, Binance, SafePal, dll.
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
        )}

        {/* ========================================================
            VIEW 2: ALL WALLETS (RESMI WALLETCONNECT / RAINBOWKIT)
            ======================================================== */}
        {currentView === "ALL_WALLETS" && (
          <div className="flex flex-col h-full max-h-[85vh] overflow-hidden">
            {/* Header: Tombol Kembali & Tutup */}
            <div className="p-5 pb-3 border-b border-gray-100 bg-white shrink-0">
              <div className="flex items-center justify-between mb-3">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setCurrentView("MAIN");
                  }}
                  className="flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-gray-900 cursor-pointer"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                  Kembali
                </button>
                <h3 className="text-[1rem] font-[800] text-gray-900 tracking-tight">
                  All Wallets
                </h3>
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

              {/* Search Bar */}
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search"
                  className="w-full pl-9 pr-4 py-2 bg-gray-100/80 hover:bg-gray-100 focus:bg-white text-xs font-semibold text-gray-900 rounded-xl border border-transparent focus:border-gray-300 focus:outline-none transition-all placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* Pesan Error / Status */}
            {errorMsg && (
              <div className="mx-5 mt-3 rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-xs font-semibold text-amber-800 leading-relaxed">
                {errorMsg}
              </div>
            )}

            {/* Grid Dompet dari WalletConnect */}
            <div className="flex-1 overflow-y-auto p-5 pt-4">
              <div className="grid grid-cols-4 gap-3">
                {filteredWallets.map((wallet) => (
                  <button
                    key={wallet.id}
                    type="button"
                    onClick={() => handleSelectWallet(wallet)}
                    className="flex flex-col items-center justify-start p-2 rounded-2xl hover:bg-gray-100/70 active:scale-95 transition-all cursor-pointer group text-center"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-white border border-gray-100 shadow-xs flex items-center justify-center p-2 mb-1.5 group-hover:shadow-md group-hover:border-gray-200 transition-all overflow-hidden shrink-0">
                      {wallet.image_url?.md || wallet.image_url?.sm ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={wallet.image_url.md || wallet.image_url.sm}
                          alt={wallet.name}
                          className="w-full h-full object-contain rounded-xl"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full rounded-xl bg-gradient-to-br from-[#d07954] to-[#7c3f31] flex items-center justify-center text-white font-bold text-base">
                          {wallet.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <span className="text-[11px] font-bold text-gray-800 leading-tight line-clamp-1 w-full">
                      {wallet.name}
                    </span>
                  </button>
                ))}
              </div>

              {filteredWallets.length === 0 && !isLoadingWallets && (
                <div className="py-8 text-center text-xs text-gray-500 font-medium">
                  Tidak ditemukan dompet &quot;{searchQuery}&quot;
                </div>
              )}
            </div>

            {/* Footer: Tombol Salin Link Studio */}
            <div className="p-4 border-t border-gray-100 bg-slate-950/[0.02] shrink-0">
              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                {copiedLink ? "Link Studio Berhasil Disalin!" : "Salin Link Studio"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
