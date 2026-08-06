/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "bkckdcbzatetyrnzdxhd.supabase.co" },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ["@google/generative-ai", "cloudinary"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Fix "unload" Permissions Policy violation
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          // Allow camera for mobile image capture
          {
            key: "Feature-Policy",
            value: "camera *",
          },
        ],
      },
      // PWA manifest proper headers
      {
        source: "/manifest.json",
        headers: [
          { key: "Content-Type", value: "application/manifest+json" },
          { key: "Cache-Control", value: "public, max-age=3600" },
        ],
      },
      // Icons cache
      {
        source: "/icon-:size.png",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
