// next.config.mjs
import bundleAnalyzer from '@next/bundle-analyzer';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ Turbopack config - ignore reports directory
  experimental: {
    turbo: {
      rules: {
        // Ignore Excel files in bundling
        '*.{xls,xlsx}': {
          loaders: [],
          as: '*.js',
        },
      },
    },
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
    optimizePackageImports: [
      'lucide-react', 
      '@radix-ui/react-icons',
      'recharts',
      'date-fns',
      'xlsx',
      'exceljs',
    ],
  },
  
  // ✅ Standalone build za Hostinger
  output: 'standalone',
  
  typescript: {
    // ⚠️ PRIVREMENO: Ignoriši TypeScript greške tokom build-a
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
  
  // ✅ Exclude public/reports from webpack processing
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Prevent bundling of public directory files
      config.externals = config.externals || [];
      config.externals.push({
        'fs/promises': 'commonjs fs/promises',
      });
    }
    
    // Ignore large directories during build
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        '**/node_modules/**',
        '**/public/reports/**', // ✅ Ignore reports directory
        '**/.git/**',
        '**/.next/**',
      ],
    };
    
    return config;
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
  
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  compress: true,
};

export default nextConfig;
