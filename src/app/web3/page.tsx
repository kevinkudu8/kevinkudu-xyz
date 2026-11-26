import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import { CommissionedWork, type Commissioned } from "@/components/commissioned-work";

// Unlisted: not in the nav or homepage, and kept out of search engines.
// Kevin sends this link directly for job opportunities.
export const metadata: Metadata = {
  title: "Web3 work",
  robots: { index: false, follow: false },
};

export default function Web3Page() {
  const commissioned = JSON.parse(
    readFileSync(join(process.cwd(), "public", "content", "commissioned.json"), "utf8"),
  ) as Commissioned;

  return (
    <main className="px-gutter flex flex-1 flex-col pt-12 pb-16 sm:pt-16">
      <h1 className="sr-only">Web3 work</h1>
      <CommissionedWork data={commissioned} />
    </main>
  );
}
