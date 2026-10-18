"use client";

import { useEffect, useRef } from "react";
import { useAccount } from "wagmi";

export function WalletConnectWatcher({
  onSuccess,
  onDisconnect,
}: {
  onSuccess: (walletAddress: string, method: string) => void;
  onDisconnect?: () => void;
}) {
  const { address, isConnected, connector } = useAccount();
  const lastAddress = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!address || !isConnected) {
      if (lastAddress.current) {
        lastAddress.current = undefined;
        onDisconnect?.();
      }
      return;
    }
    if (address !== lastAddress.current) {
      lastAddress.current = address;
      onSuccess(address, connector?.name || "WalletConnect");
    }
  }, [address, isConnected, connector, onSuccess, onDisconnect]);

  return null;
}
