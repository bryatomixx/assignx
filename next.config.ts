import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve("."),
  },
  // The marketing homepage is hidden for now: send the root straight to login.
  // (307 temporary so it is easy to revert when the homepage is brought back.)
  async redirects() {
    return [{ source: "/", destination: "/login", permanent: false }];
  },
};

export default nextConfig;
