import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,
  output: "export",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
