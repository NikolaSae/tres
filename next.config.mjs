// next.config.mjs - ČIST TURBOPACK PRISTUP
import bundleAnalyzer from '@next/bundle-analyzer';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ Turbopack config
  turbopack: {
    // Možete dodati Turbopack-specifične optimizacije ovde kasnije
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'localhost' },
      { protocol: 'https', hostname: '*.app.github.dev' },
    ],
  },

  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        "localhost:3001",
        "*.app.github.dev",
      ],
      allowedForwardedHosts: [
        "localhost:3000",
        "localhost:3001",
        "*.app.github.dev",
      ],
    },
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },

  async headers() {
    const forwardedHost = process.env.NEXTAUTH_URL?.replace("https://", "") || "";
    
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "x-forwarded-host",
            value: forwardedHost,
          },
          {
            key: "Access-Control-Allow-Origin",
            value: process.env.NEXTAUTH_URL || "*",
          },
        ],
      },
    ];
  },

  output: 'standalone',
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
};

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default withBundleAnalyzer(nextConfig);