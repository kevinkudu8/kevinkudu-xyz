import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BackgroundGrid } from "@/components/background-grid";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://kevinkudu.xyz"),
  title: {
    default: "Kevin Kudu",
    template: "%s · Kevin Kudu",
  },
  description:
    "I create events and content for tech and web3 companies. Currently living in Seoul.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="relative isolate flex min-h-full flex-col">
        <BackgroundGrid />
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
