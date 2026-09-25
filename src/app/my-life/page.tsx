import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Life" };

export default function MyLifePage() {
  return (
    <main className="px-gutter flex-1 py-16 sm:py-24">
      <h1 className="text-[clamp(2rem,3.5vw,3.25rem)] tracking-tight">
        My Life
      </h1>
      <p className="mt-8 max-w-prose tracking-wide">
        I believe life is about consuming beautiful things with people you love.
        Here are things I have consumed
      </p>
    </main>
  );
}
