// next.config.mjs

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'localhost',
      '*.app.github.dev' // Dozvoli slike sa GitHub Codespaces domena
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        "*.app.github.dev", // Wildcard za sve Codespaces instance
        process.env.NEXTAUTH_URL?.replace("https://", "") || "" // Dinamički host iz environmenta
      ],
      allowedForwardedHosts: [
        "localhost:3000",
        "*.app.github.dev", // Wildcard za sve Codespaces instance
        process.env.NEXTAUTH_URL?.replace("https://", "") || "" // Dinamički host
      ],
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "x-forwarded-host",
            value: process.env.NEXTAUTH_URL?.replace("https://", "") || "",
          },
          {
            key: "Access-Control-Allow-Origin",
            value: process.env.NEXTAUTH_URL || "https://*.app.github.dev",
          },
        ],
      },
    ];
  },
};

export default nextConfig;