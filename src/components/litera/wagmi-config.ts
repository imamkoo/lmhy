"use client";

import { createConfig } from "wagmi";
import { polygon } from "wagmi/chains";
import { http, fallback } from "wagmi";
import { walletConnect, injected, coinbaseWallet } from "wagmi/connectors";

export const projectId = "d94f04faafa515ac177c9c41052264b7";

export const metadata = {
  name: "Let Me Hear You",
  description: "Platform & Komunitas Kesehatan Mental",
  url: typeof window !== "undefined" ? window.location.origin : "https://letmehearyou.id",
  icons: ["https://letmehearyou.id/icon-192.png"],
};

const chains = [polygon] as const;

const isBrowser = typeof window !== "undefined";

export const config = createConfig({
  chains,
  multiInjectedProviderDiscovery: isBrowser,
  connectors: isBrowser
    ? [
        walletConnect({ projectId, metadata, showQrModal: false }),
        injected({ shimDisconnect: true }),
        coinbaseWallet({ appName: metadata.name, appLogoUrl: metadata.icons[0] }),
      ]
    : [],
  ssr: false,
  transports: {
    [polygon.id]: fallback([
      http("https://polygon-bor-rpc.publicnode.com", { timeout: 8000 }),
      http("https://1rpc.io/polygon", { timeout: 8000 }),
    ], { rank: false }),
  },
});
