import type { Metadata } from "next";
import { Shelf } from "@/components/shelf";
import { getBooks } from "@/lib/books";
import { getFilms } from "@/lib/films";
import type { ShelfItem } from "@/lib/shelf-item";

export const metadata: Metadata = { title: "My Life" };

export default async function MyLifePage() {
  const [books, films] = await Promise.all([getBooks(), getFilms()]);

  const bookItems: ShelfItem[] = books.map((b) => ({
    id: b.id,
    title: b.title,
    byline: b.author,
    meta: b.year ? `Year read ${b.year}` : "",
    favourite: b.favourite,
    image: b.cover,
    aspect: b.aspect,
    imageUnoptimized: b.cover?.startsWith("/covers/"),
  }));

  const filmItems: ShelfItem[] = films.map((f) => ({
    id: f.href,
    title: f.title,
    byline: f.year ? String(f.year) : "",
    meta: f.watched ? `Watched ${f.watched.slice(0, 4)}` : "",
    favourite: f.rating === 5,
    image: f.poster,
    imageUnoptimized: true, // TMDB already serves sized images
    href: f.href,
  }));

  return (
    <main className="px-gutter flex-1 py-16 sm:py-24">
      <h1 className="text-[clamp(1.8rem,2.45vw,2.95rem)] tracking-[0.05em]">My Life</h1>
      <p className="mt-8 max-w-prose text-sm tracking-[0.05em] sm:text-base">
        I believe life is about consuming beautiful things with people you love. Here are
        things I have consumed.
      </p>
      <Shelf books={bookItems} films={filmItems} />
    </main>
  );
}
