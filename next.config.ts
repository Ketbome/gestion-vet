import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Build autocontenido para Docker (copia solo lo necesario a .next/standalone)
  output: "standalone",
};

export default nextConfig;
