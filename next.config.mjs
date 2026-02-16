// next.config.mjs
let withBundleAnalyzer;

try {
  const bundleAnalyzer = await import('@next/bundle-analyzer');
  withBundleAnalyzer = bundleAnalyzer.default({
    enabled: process.env.ANALYZE === 'true',
  });
} catch {
  withBundleAnalyzer = (config) => config;
}

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
  
  serverExternalPackages: ['prisma', '@prisma/client', 'xlsx', 'exceljs'],
  output: 'standalone',
  
  // ⭐ KLJUČNA PROMENA: Isključi TypeScript checking tokom build-a
  typescript: {
    ignoreBuildErrors: true, // ← Hostinger nema dovoljno RAM-a
  },
  
  // ⭐ KLJUČNA PROMENA: Isključi ESLint tokom build-a
  eslint: {
    ignoreDuringBuilds: true, // ← Još jedna ušteda memorije
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
  
  turbopack: {
    resolveAlias: {
      canvas: './empty-module.js',
    },
  },
  
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
  
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "origin-when-cross-origin" },
        ],
      },
      {
        source: '/static/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/reports/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=3600, must-revalidate' }],
      },
      {
        source: '/api/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store, must-revalidate' }],
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