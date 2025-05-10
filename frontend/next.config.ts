import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['jwt-decode'],
  },
  /* config options here */
};

export default nextConfig;
