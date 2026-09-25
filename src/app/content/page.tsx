import type { Metadata } from "next";
import { FilmRow } from "@/components/film-row";
import { getWorkFilms } from "@/lib/work-films";

export const metadata: Metadata = { title: "Content" };

export default function ContentPage() {
  return (
    <main className="px-gutter flex-1 py-16 sm:py-24">
      <h1 className="font-mono text-2xl font-bold tracking-wider uppercase">Film</h1>
      <p className="mt-8 font-mono tracking-wider uppercase">Make an idea happen.</p>
      <div className="mt-16 sm:mt-24">
        <FilmRow films={getWorkFilms()} />
      </div>
    </main>
  );
}
