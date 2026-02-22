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
  cacheComponents: true,

  // ============================================================
  // EXPERIMENTAL
  // ============================================================
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
    // webpackBuildWorker uklonjen — nije podržan u Next.js 16
  },

  serverExternalPackages: ['prisma', '@prisma/client', 'xlsx', 'exceljs'],
  output: 'standalone',

  // ⚠️  Vrati na false kada popravi TypeScript greške — ovo skriva bugove!
  typescript: {
    ignoreBuildErrors: true,
  },
  // eslint se više ne konfiguriše u next.config.mjs od Next.js 16
  // Koristiti .eslintrc.json ili eslint.config.mjs umesto toga

  // ============================================================
  // IMAGES
  // ============================================================
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

  // ============================================================
  // TURBOPACK
  // ============================================================
  turbopack: {
    resolveAlias: {
      canvas: './empty-module.js',
    },
  },

  // ============================================================
  // WEBPACK
  // ============================================================
  webpack: (config, { isServer }) => {
    config.optimization = {
      ...config.optimization,
      moduleIds: 'deterministic',
      minimize: true,
    };

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

  // ============================================================
  // SECURITY HEADERS
  // ============================================================
  async headers() {
    return [
      // --- Globalni security headers ---
      {
        source: "/(.*)",
        headers: [
          // DNS prefetch za performanse
          { key: "X-DNS-Prefetch-Control", value: "on" },

          // HSTS — forsiraj HTTPS zauvek (2 godine)
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },

          // FIX: Bilo je SAMEORIGIN — promenjeno na DENY jer aplikacija ne koristi iframes
          // Ako negde embeduješ vlastite stranice u iframe, vrati na SAMEORIGIN
          { key: "X-Frame-Options", value: "DENY" },

          // Sprečava MIME sniffing napade
          { key: "X-Content-Type-Options", value: "nosniff" },

          // FIX: Bilo je origin-when-cross-origin — strožije za finansijsku aplikaciju
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },

          // NOVO: Ograniči browser API-je koje stranica može koristiti
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=()" },

          // NOVO: Sprečava cross-origin napade na resurse
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },

          // NOVO: Content Security Policy
          // Prilagodi connect-src ako dodaš nove externe servise
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // Next.js zahteva unsafe-eval u dev modu; u produkciji razmotriti nonce
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "font-src 'self' data:",
              "img-src 'self' data: blob: https://*.supabase.co https://finappsolutions.com",
              // API pozivi dozvoljeni samo ka ovim domenima
              [
                "connect-src 'self'",
                "https://*.supabase.co",
                "https://api.resend.com",
                "https://api.openai.com",
                "https://finappsolutions.com",
                // Upstash Redis (WebSocket za real-time)
                "wss://*.upstash.io",
              ].join(" "),
              "frame-ancestors 'none'",
              "form-action 'self'",
              "base-uri 'self'",
              "object-src 'none'",
              // Blokira mixed content (http na https stranici)
              "upgrade-insecure-requests",
            ].join("; "),
          },
        ],
      },

      // --- Statički assets — agresivno keširanje ---
      {
        source: '/static/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/_next/static/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },

      // --- Izveštaji — kratko keširanje ---
      {
        source: '/reports/:path*',
        headers: [{ key: 'Cache-Control', value: 'private, max-age=3600, must-revalidate' }],
        // FIX: Bilo je 'public' — izveštaji su privatni pa treba 'private'
      },

      // --- API rute — nikad ne keširaj ---
      {
        source: '/api/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' }],
      },
    ];
  },

  // ============================================================
  // OSTALO
  // ============================================================
  productionBrowserSourceMaps: false, // Ne expose-uj source kod u produkciji
  poweredByHeader: false,             // Ne otkrivaj da koristiš Next.js
  compress: true,

  generateBuildId: async () => {
    return process.env.VERCEL_GIT_COMMIT_SHA || `build-${Date.now()}`;
  },

  logging: {
    fetches: {
      fullUrl: false, // Ne loguj pune URL-ove (mogu sadržati tokene)
    },
  },
};

export default withBundleAnalyzer(nextConfig);
