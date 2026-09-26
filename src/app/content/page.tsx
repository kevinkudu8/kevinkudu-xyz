import type { Metadata } from "next";
import { FilmRow } from "@/components/film-row";
import { getWorkFilms } from "@/lib/work-films";

export const metadata: Metadata = { title: "Content" };

export default function ContentPage() {
  return (
    <main className="px-gutter flex flex-1 flex-col justify-center py-16">
      <h1 className="sr-only">Film. Make an idea happen.</h1>
      <FilmRow films={getWorkFilms()} />
    </main>
  );
}
