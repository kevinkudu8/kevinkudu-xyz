import type { Metadata } from "next";
import { Shelf } from "@/components/shelf";
import { getBooks } from "@/lib/books";

export const metadata: Metadata = { title: "My Life" };

export default async function MyLifePage() {
  const books = await getBooks();

  return (
    <main className="px-gutter flex-1 py-16 sm:py-24">
      <h1 className="text-[clamp(1.8rem,2.45vw,2.95rem)] tracking-[0.05em]">My Life</h1>
      <p className="mt-8 max-w-prose text-sm tracking-[0.05em] sm:text-base">
        I believe life is about consuming beautiful things with people you love. Here are
        things I have consumed.
      </p>
      <Shelf books={books} />
    </main>
  );
}
