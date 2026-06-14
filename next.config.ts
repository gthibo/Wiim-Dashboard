import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server bundle for a small Docker image.
  output: "standalone",
  // Native modules must stay external (not bundled by webpack/turbopack).
  serverExternalPackages: ["better-sqlite3", "@node-rs/argon2"],
  poweredByHeader: false,
  reactStrictMode: true,
  // The WiiM device API is reached only from the server; album-art images are
  // proxied through our own /api route, so no remote image hosts are allowed.
  images: { remotePatterns: [] },
};

export default nextConfig;
