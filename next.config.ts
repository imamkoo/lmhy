import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.literaa.xyz https://www.googletagmanager.com; connect-src 'self' https://literaa.xyz https://cdn.literaa.xyz https://ipfs.literaa.xyz:8443 https://polygon-bor-rpc.publicnode.com https://1rpc.io https://www.google-analytics.com https://auth.privy.io https://*.privy.io https://cca-lite.coinbase.com https://api.web3modal.org https://explorer-api.walletconnect.com https://pulse.walletconnect.org wss://relay.walletconnect.com wss://*.walletconnect.com wss://*.walletconnect.org; img-src 'self' data: https: blob:; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com; font-src 'self' data: https://cdnjs.cloudflare.com https://fonts.gstatic.com; frame-src 'self' https://verify.walletconnect.com https://*.walletconnect.com https://*.privy.io;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;


