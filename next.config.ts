import type { NextConfig } from "next";

const BACKEND_TUNNEL_URL = process.env.BACKEND_API_URL || 'https://hay-vhs-textbook-liability.trycloudflare.com';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${BACKEND_TUNNEL_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
