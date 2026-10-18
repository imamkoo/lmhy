import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@base-org/account",
    "@coinbase/cdp-sdk",
    "@x402/core",
    "@x402/evm",
  ],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "images.pexels.com" },
      { protocol: "https", hostname: "ipfs.literaa.xyz" },
      { protocol: "https", hostname: "letmehearyou.id" },
      { protocol: "https", hostname: "gateway.pinata.cloud" },
    ],
  },
  async redirects() {
    return [
      {
        source: "/blog",
        destination: "/articles",
        permanent: true,
      },
      {
        source: "/blog/:slug*",
        destination: "/articles",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.literaa.xyz https://www.googletagmanager.com; connect-src 'self' https://*.supabase.co https://literaa.xyz https://cdn.literaa.xyz https://ipfs.literaa.xyz:8443 https://gateway.pinata.cloud https://ipfs.io https://*.ipfs.dweb.link https://dweb.link https://cloudflare-ipfs.com https://polygon.drpc.org https://polygon.gateway.tenderly.co https://polygon-bor-rpc.publicnode.com https://1rpc.io https://www.google-analytics.com https://auth.privy.io https://*.privy.io https://cca-lite.coinbase.com https://www.walletlink.org https://api.web3modal.com https://explorer-api.walletconnect.com https://rpc.walletconnect.com https://pulse.walletconnect.com https://verify.walletconnect.com https://verify.walletconnect.org https://echo.walletconnect.com wss://relay.walletconnect.com wss://*.walletconnect.com wss://*.walletconnect.org; img-src 'self' data: https: blob:; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com; font-src 'self' data: https://cdnjs.cloudflare.com https://fonts.gstatic.com; frame-src 'self' https://verify.walletconnect.com https://verify.walletconnect.org https://*.walletconnect.com https://*.privy.io;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;


