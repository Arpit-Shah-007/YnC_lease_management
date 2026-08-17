import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['pdf-parse', '@react-pdf/renderer', 'sharp'],
};

export default nextConfig;
