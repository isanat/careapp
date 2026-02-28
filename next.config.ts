import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: false,
  experimental: {
    // Disable turbo temporarily to fix cache issues
  },
  // Empty turbopack config to silence warning
  turbopack: {},
};

export default nextConfig;
