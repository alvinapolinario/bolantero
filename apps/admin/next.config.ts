import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@bolantero/shared",
    "@bolantero/database",
    "@bolantero/ui",
  ],
};

export default nextConfig;
