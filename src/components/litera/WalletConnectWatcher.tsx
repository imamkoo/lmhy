"use client";

import { useEffect, useRef } from "react";
import { useAccount } from "wagmi";

export function WalletConnectWatcher({
  onSuccess,
}: {
  onSuccess: (walletAddress: string, method: string) => void;
}) {
  const { address, isConnected, connector } = useAccount();
  const lastAddress = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!address || !isConnected) {
      lastAddress.current = undefined;
      return;
    }
    if (address !== lastAddress.current) {
      lastAddress.current = address;
      onSuccess(address, connector?.name || "WalletConnect");
    }
  }, [address, isConnected, connector, onSuccess]);

  return null;
}
