import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: '2mb' }
  },
  headers: async () => {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" }
        ]
      }
    ];
  },
  // Hint: ensure Node.js runtime on Vercel for NextAuth routes
  auth: {
    provider: "authjs",
    enableWebCrypto: false
  } as any
};

export default nextConfig;
