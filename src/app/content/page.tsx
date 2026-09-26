import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import { CommissionedWork, type Commissioned } from "@/components/commissioned-work";
import { ContentTabs } from "@/components/content-tabs";
import { FilmRow } from "@/components/film-row";
import { getWorkFilms } from "@/lib/work-films";

export const metadata: Metadata = { title: "Content" };

export default function ContentPage() {
  const commissioned = JSON.parse(
    readFileSync(join(process.cwd(), "public", "content", "commissioned.json"), "utf8"),
  ) as Commissioned;

  return (
    <main className="px-gutter flex flex-1 flex-col pt-12 pb-16 sm:pt-16">
      <h1 className="sr-only">Content: films and commissioned work</h1>
      <ContentTabs films={<FilmRow films={getWorkFilms()} />} commissioned={<CommissionedWork data={commissioned} />} />
    </main>
  );
}
