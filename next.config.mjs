// next.config.mjs
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
  serverActions: {
    bodySizeLimit: '10mb',
    allowedOrigins: [
      "finappsolutions.com",
      "*.finappsolutions.com",
    ],
    allowedForwardedHosts: [
      "finappsolutions.com",
      "*.finappsolutions.com",
    ],
  },
  optimizePackageImports: [
    'lucide-react', 
    '@radix-ui/react-icons',
    'recharts',
    'date-fns',
  ],
  optimizeCss: true,
},
  
  // ✅ Next.js 16: Server-only packages
  serverExternalPackages: ['prisma', '@prisma/client', 'xlsx', 'exceljs'],
  
  // ✅ Standalone build za Hostinger
  output: 'standalone',
  
  typescript: {
    ignoreBuildErrors: false,
  },
  
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'finappsolutions.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96],
    minimumCacheTTL: 60,
    formats: ['image/webp'],
  },
  
  // ⭐ KRITIČNO: Turbopack config (mora biti prisutan ako imaš webpack)
  turbopack: {
    // Prazan config je OK - Next.js 16 zahteva samo da postoji
    resolveAlias: {
      // Opciono: canvas fallback
      canvas: './empty-module.js',
    },
  },
  
  // ✅ WEBPACK CONFIG - fallback za `--webpack` flag
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'fs/promises': 'commonjs fs/promises',
        'fs': 'commonjs fs',
        'path': 'commonjs path',
      });
    }
    
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      os: false,
    };
    
    // Ignoriši public/reports za webpack mode
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        '**/node_modules/**',
        '**/public/reports/**',
        '**/.git/**',
        '**/.next/**',
        '**/prisma/**',
        '**/.env*',
      ],
    };
    
    return config;
  },
  
  // ✅ Headers sa caching strategijom
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
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/reports/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, must-revalidate',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
        ],
      },
    ];
  },
  
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  compress: true,
  
  generateBuildId: async () => {
    return process.env.VERCEL_GIT_COMMIT_SHA || `build-${Date.now()}`;
  },
  
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
};

export default withBundleAnalyzer(nextConfig);