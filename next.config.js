/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "bkckdcbzatetyrnzdxhd.supabase.co" },
    ],
  },
  serverExternalPackages: ["@google/generative-ai", "cloudinary"],
};

module.exports = nextConfig;
