import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  images: {
    // Book covers resolved by Open Library cover ID (see src/lib/books.ts)
    remotePatterns: [
      new URL("https://covers.openlibrary.org/b/id/**"),
      // YouTube thumbnails for the commissioned work
      new URL("https://i.ytimg.com/vi/**"),
    ],
  },
};

export default nextConfig;
