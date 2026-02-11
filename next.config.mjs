// next.config.mjs
import bundleAnalyzer from '@next/bundle-analyzer';

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // OPTIMIZACIJA: Webpack config samo za production build
  webpack: (config, { isServer, dev }) => {
    // U development-u, pusti Next.js da upravlja kešem
    // U production-u, optimizuj
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
          },
        },
      };
    }
    
    return config;
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
  
  // NOVO: Isključi webpack warning za velike stringove
  onDemandEntries: {
    // Period koliko stranica ostaje u memoriji
    maxInactiveAge: 60 * 60 * 1000,
    pagesBufferLength: 5,
  },
};

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default withBundleAnalyzer(nextConfig);