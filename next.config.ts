import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["better-sqlite3", "bindings"],
  images: {
    unoptimized: true,
  },
  experimental: {
    preloadEntriesOnStart: false,
  },
};

export default nextConfig;
