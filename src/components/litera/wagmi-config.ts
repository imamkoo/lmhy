"use client";

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import {
  metaMaskWallet,
  trustWallet,
  bitgetWallet,
  coinbaseWallet,
  braveWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { polygon } from "wagmi/chains";
import { http, fallback } from "wagmi";

export const projectId = "d94f04faafa515ac177c9c41052264b7";

export const metadata = {
  name: "Let Me Hear You",
  description: "Platform & Komunitas Kesehatan Mental",
  url: typeof window !== "undefined" ? window.location.origin : "https://letmehearyou.id",
  icons: ["https://letmehearyou.id/icon-192.png"],
};

export const config = getDefaultConfig({
  appName: metadata.name,
  appDescription: metadata.description,
  appUrl: metadata.url,
  appIcon: metadata.icons[0],
  projectId,
  chains: [polygon],
  wallets: [
    {
      groupName: "Populer",
      wallets: [
        metaMaskWallet,
        trustWallet,
        bitgetWallet,
        coinbaseWallet,
        braveWallet,
        walletConnectWallet,
      ],
    },
  ],
  ssr: true,
  transports: {
    [polygon.id]: fallback([
      http("https://polygon-bor-rpc.publicnode.com", { timeout: 8000 }),
      http("https://1rpc.io/polygon", { timeout: 8000 }),
    ], { rank: false }),
  },
});
