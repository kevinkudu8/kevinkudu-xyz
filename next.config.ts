import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // Old Cargo site addresses, so saved and shared links keep working
  async redirects() {
    return [
      ["/home-1", "/"],
      ["/content-1", "/content#commissioned"],
      ["/tracking", "/my-life"],
      ["/circle-arc", "/events#arc-studio"],
      ["/crypto-com", "/events#crypto-com-x-ufc"],
      ["/robinhood", "/events#robinhood-bitcoin-2025"],
      ["/paypal-usd", "/events#paypal-usd"],
      ["/akash", "/events#akash"],
      ["/ethglobal-lisbon", "/events#ethglobal"],
      ["/ethmexico-2023", "/events"],
    ].map(([source, destination]) => ({ source, destination, permanent: true }));
  },
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
