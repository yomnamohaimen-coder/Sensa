import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["puppeteer"],
  transpilePackages: ["rrweb-player"],
};

export default nextConfig;
