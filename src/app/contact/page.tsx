import type { Metadata } from "next";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <main className="px-gutter flex-1 py-16 sm:py-24">
      <h1 className="text-[clamp(2rem,3.5vw,3.25rem)] tracking-tight">
        Contact
      </h1>
    </main>
  );
}
