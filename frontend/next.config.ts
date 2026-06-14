import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Slim runtime image for Docker (docs/12 §2).
  output: "standalone",
  reactStrictMode: true,
  experimental: {
    // Smaller client bundles (docs/05 §10).
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
