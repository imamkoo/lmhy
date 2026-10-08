"use client";

import { useCallback } from "react";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useConnect, useConnectors } from "wagmi";

/**
 * Deteksi apakah pengguna berada di browser perangkat seluler (smartphone/tablet)
 * atau dalam mode emulasi mobile (layar <= 768px / mobile user-agent).
 */
export const isMobileDevice = (): boolean => {
  if (typeof window === "undefined") return false;
  const userAgent =
    navigator.userAgent ||
    (navigator as unknown as { vendor?: string }).vendor ||
    (window as unknown as { opera?: string }).opera ||
    "";
  const mobileRegex =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile/i;
  const isNarrowScreen =
    typeof window.innerWidth === "number" && window.innerWidth <= 768;
  return mobileRegex.test(userAgent) || isNarrowScreen;
};

/**
 * Smart hook untuk membuka modal koneksi dompet Web3:
 * - Pada mode mobile: langsung membuka WalletConnect modal ("All Wallets" view)
 *   yang mendukung deep-linking ke MetaMask, Bitget, Trust Wallet, Binance, SafePal, dll.
 *   Menghindari modal RainbowKit yang tombol ekstensi desktop-nya tidak berfungsi di mobile.
 * - Pada mode desktop: membuka modal RainbowKit standar.
 */
export const useSmartConnectModal = () => {
  const { openConnectModal: openRainbowModal } = useConnectModal();
  const { connectAsync } = useConnect();
  const connectors = useConnectors();

  const openConnectModal = useCallback(async () => {
    const isMobile = isMobileDevice();

    const wcConnector = connectors?.find(
      (c) =>
        c.id === "walletConnect" ||
        c.type === "walletConnect" ||
        c.name.toLowerCase().includes("walletconnect")
    );

    // Di mode mobile: picu langsung WalletConnect agar muncul modal "All Wallets" & Android system intent
    if (isMobile && wcConnector) {
      try {
        await connectAsync({ connector: wcConnector });
      } catch (err: unknown) {
        // Tangkap pembatalan / penutupan modal tanpa melempar uncaught error
        console.log(
          "WalletConnect session closed or cancelled:",
          (err as { message?: string })?.message || err
        );
      }
      return;
    }

    // Di desktop: buka modal RainbowKit
    if (openRainbowModal) {
      openRainbowModal();
      return;
    }

    // Fallback jika RainbowKit modal tidak tersedia
    if (wcConnector) {
      try {
        await connectAsync({ connector: wcConnector });
      } catch (err: unknown) {
        console.log(
          "WalletConnect session closed or cancelled:",
          (err as { message?: string })?.message || err
        );
      }
    }
  }, [connectAsync, connectors, openRainbowModal]);

  return { openConnectModal };
};
