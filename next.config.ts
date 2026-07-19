import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project so Next doesn't pick up an
  // unrelated lockfile elsewhere under ~/Downloads.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
