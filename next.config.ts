import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: isProd ? '/axiom-sovereign' : '',
  // assetPrefix: isProd ? '/axiom-sovereign/' : '', // Simplified for better compatibility with basePath
  trailingSlash: true,
  /* config options here */
};

export default nextConfig;
