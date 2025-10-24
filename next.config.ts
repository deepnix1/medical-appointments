import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config, { isServer }) => {
    // Exclude Firebase Functions from Next.js build
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
  // Exclude functions directory from build
  experimental: {
    outputFileTracingExcludes: {
      '*': ['./functions/**/*'],
    },
  },
};

export default nextConfig;
