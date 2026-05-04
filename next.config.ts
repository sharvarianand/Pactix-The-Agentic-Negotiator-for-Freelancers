import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    // Keep server actions default; nothing custom here yet
  },
};

export default nextConfig;
