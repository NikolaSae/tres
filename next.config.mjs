// next.config.mjs - ČIST TURBOPACK PRISTUP
import bundleAnalyzer from '@next/bundle-analyzer';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ VAŽNO: Standalone build za Hostinger
  output: 'standalone',
  
  // ✅ Turbopack samo za development
  ...(process.env.NODE_ENV === 'development' && {
    turbopack: {},
  }),

  typescript: {
    ignoreBuildErrors: false, // ✅ Promenio na false - bolje za production
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'finappsolutions.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
    // ✅ Optimizacija za Hostinger
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96],
    minimumCacheTTL: 60,
    formats: ['image/webp'],
  },

  experimental: {
    serverActions: {
      allowedOrigins: [
        "finappsolutions.com",
        "*.finappsolutions.com",
      ],
      allowedForwardedHosts: [
        "finappsolutions.com",
        "*.finappsolutions.com",
      ],
    },
    // ✅ Optimizacija package imports
    optimizePackageImports: [
      'lucide-react', 
      '@radix-ui/react-icons',
      'recharts',
      'date-fns',
    ],
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on"
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload"
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN"
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff"
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin"
          },
        ],
      },
    ];
  },

  // ✅ Production optimizacije
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  compress: true,
  
  // ✅ Webpack optimizacija (fallback ako Turbopack nije dostupan)
  webpack: (config, { isServer }) => {
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
};

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default withBundleAnalyzer(nextConfig);