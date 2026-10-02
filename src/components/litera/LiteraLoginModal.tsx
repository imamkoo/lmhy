"use client";

import { useState, useEffect, useRef } from "react";

interface LiteraLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (walletAddress: string, method: string) => void;
}

export function LiteraLoginModal({ isOpen, onClose, onSuccess }: LiteraLoginModalProps) {
  const [popupActive, setPopupActive] = useState(false);
  const [popupError, setPopupError] = useState<string | null>(null);
  const popupRef = useRef<Window | null>(null);

  const LITERA_ORIGIN = process.env.NEXT_PUBLIC_LITERA_DASHBOARD_URL || "https://literaa.xyz";

  useEffect(() => {
    if (!isOpen) return;

    // Listener menerima pesan postMessage dari Litera /widget-auth popup
    const handleAuthMessage = (event: MessageEvent) => {
      // Hanya terima pesan dari origin resmi Litera
      if (!event.origin.includes("literaa.xyz") && !event.origin.includes("localhost")) {
        return;
      }

      const data = event.data;
      if (data && data.type === "LITERA_CLOUD_LOGIN_SUCCESS" && data.address) {
        onSuccess(data.address, "Litera Cloud Wallet (Google / Email)");
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

  const openLiteraCloudAuth = () => {
    setPopupError(null);
    setPopupActive(true);

    const nonce = Math.random().toString(36).slice(2);
    const callbackArticle = typeof window !== "undefined" ? window.location.href : "https://letmehearyou.id";

    const popupUrl = `${LITERA_ORIGIN}/widget-auth?article=${encodeURIComponent(callbackArticle)}&state=${nonce}`;

    const w = 440;
    const h = 680;
    const left = window.screenX + (window.outerWidth - w) / 2;
    const top = window.screenY + (window.outerHeight - h) / 2;

    const popup = window.open(
      popupUrl,
      "litera-auth-window",
      `width=${w},height=${h},left=${left},top=${top},status=no,menubar=no,toolbar=no`
    );

    if (!popup) {
      setPopupError("Popup diblokir oleh browser. Harap izinkan pop-up untuk domain ini.");
      setPopupActive(false);
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

  const handleLocalMetaMask = () => {
    const win = window as Window & { ethereum?: { request: (args: { method: string }) => Promise<string[]> } };
    if (typeof win !== "undefined" && win.ethereum) {
      win.ethereum
        .request({ method: "eth_requestAccounts" })
        .then((accounts: string[]) => {
          if (accounts && accounts[0]) {
            onSuccess(accounts[0], "MetaMask Extension");
            onClose();
          }
        })
        .catch((err: Error) => {
          setPopupError(err.message || "Pengguna menolak koneksi MetaMask.");
        });
    } else {
      setPopupError("Ekstensi MetaMask tidak terdeteksi. Silakan gunakan opsi Akun Litera Cloud (Google/Email).");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#d07954] text-white font-bold shadow-md shadow-[#d07954]/20">
              💎
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Hubungkan Akun Litera Web3</h3>
              <p className="text-xs text-slate-500">Klaim kepemilikan NFT & sertifikat digital</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="mt-5 space-y-4">
          <p className="text-xs leading-relaxed text-slate-600">
            Penulis membutuhkan akun atau alamat dompet Web3 untuk menerima kepemilikan sertifikat on-chain di Polygon.
          </p>

          {popupError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
              ⚠️ {popupError}
            </div>
          )}

          {/* Opsi 1: Cloud Auth Resmi (Google / Email) */}
          <button
            type="button"
            onClick={openLiteraCloudAuth}
            disabled={popupActive}
            className="w-full flex items-center justify-between rounded-2xl border-2 border-[#d07954] bg-[#d07954]/5 p-4 text-left transition hover:bg-[#d07954]/10 disabled:opacity-50"
          >
            <div>
              <span className="block text-sm font-bold text-slate-900">
                🌐 Akun Litera Cloud (Google / Email)
              </span>
              <span className="text-[11px] text-slate-500">
                Mudah tanpa instal aplikasi, dibuatkan otomatis via Privy
              </span>
            </div>
            <span className="text-xs font-bold text-[#d07954]">
              {popupActive ? "⏳ Membuka..." : "Buka →"}
            </span>
          </button>

          {/* Opsi 2: MetaMask / Browser Wallet */}
          <button
            type="button"
            onClick={handleLocalMetaMask}
            className="w-full flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:bg-slate-100 hover:border-slate-300"
          >
            <div>
              <span className="block text-sm font-bold text-slate-800">
                🦊 Ekstensi Dompet (MetaMask)
              </span>
              <span className="text-[11px] text-slate-500">
                Gunakan dompet Web3 pribadi di browser Anda
              </span>
            </div>
            <span className="text-xs font-bold text-slate-600">
              Konek →
            </span>
          </button>

          <div className="rounded-2xl bg-amber-50 p-3 border border-amber-200/70 text-[11px] text-amber-900 leading-relaxed">
            🛡️ <strong>Keamanan Terjamin:</strong> Autentikasi diproses langsung di domain resmi <code>https://literaa.xyz</code>. Kunci privat Anda tersimpan aman dan terenkripsi.
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}
