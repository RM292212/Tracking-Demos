import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required by spec: Strict mode must be enabled to verify single GTM injection guard
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
