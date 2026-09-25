import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  images: {
    // Book covers resolved by Open Library cover ID (see src/lib/books.ts)
    remotePatterns: [new URL("https://covers.openlibrary.org/b/id/**")],
  },
};

export default nextConfig;
