import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
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
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.literaa.xyz https://www.googletagmanager.com; connect-src 'self' https://literaa.xyz https://cdn.literaa.xyz https://polygon-bor-rpc.publicnode.com https://1rpc.io https://polygon.llamarpc.com https://www.google-analytics.com; img-src 'self' data: https: blob:; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; font-src 'self' data: https://cdnjs.cloudflare.com; frame-src 'self' https://verify.walletconnect.com https://*.privy.io;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
