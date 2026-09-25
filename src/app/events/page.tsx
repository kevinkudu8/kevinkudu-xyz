import type { Metadata } from "next";

export const metadata: Metadata = { title: "Events" };

export default function EventsPage() {
  return (
    <main className="px-gutter flex-1 py-16 sm:py-24">
      <h1 className="font-mono text-sm font-bold tracking-wider uppercase">
        Events and Experiential
      </h1>
    </main>
  );
}
