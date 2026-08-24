import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      // Product shots served from Supabase Storage once you upload your own.
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};

export default nextConfig;
