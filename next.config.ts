import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * One canonical host. The shop is stedm.net; www.stedm.net is the same site
   * and sends visitors — and link equity — to the apex rather than splitting
   * the two. Permanent so browsers and crawlers stop asking.
   */
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.stedm.net" }],
        destination: "https://stedm.net/:path*",
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      // Product shots served from Supabase Storage once you upload your own.
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};

export default nextConfig;
