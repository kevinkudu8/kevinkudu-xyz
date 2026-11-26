import type { Metadata } from "next";
import { FilmGrid } from "@/components/film-grid";
import { getWorkFilms } from "@/lib/work-films";

export const metadata: Metadata = { title: "Film" };

const STATUS = "Available for projects";
const EMAIL = "kevinkudukis@gmail.com"; // same as the contact page

// The nav's monospace style, shared by the info block and the section label
const mono = "font-mono text-[0.72rem] tracking-[0.06em] uppercase sm:text-[0.8rem] lg:text-[0.875rem]";

export default function FilmPage() {
  return (
    <main className="px-gutter flex flex-1 flex-col pt-6 pb-24 sm:pt-10">
      <h1 className="sr-only">Film</h1>

      {/* Same columns and gap as the video grid, so the intro lines up with the left video and the info block
          with the right one. Stacks below md, where the grid becomes one column. */}
      <section className="grid grid-cols-1 gap-x-5 gap-y-6 md:grid-cols-2">
        <div className="max-w-[60ch] space-y-3 text-[15px] leading-[1.55] tracking-[0.005em] [&_p]:text-pretty">
          <p>
            I tell stories through short documentaries, music videos and commercials, as a director, producer and
            editor with six years in the field.
          </p>
          <p className="text-muted">
            Recent work includes a Toronto hip-hop doc that premiered to a sold-out crowd, a micro-doc shot on 16mm, a
            Levi&rsquo;s spec ad, and promo videos for CoinDesk. At ETHGlobal, I led video production for over a
            year: 600+ videos edited, 25+ events&nbsp;produced.
          </p>
        </div>

        {/* Line height matches the intro's, so the first lines sit level */}
        <ul className={`${mono} leading-[calc(15px*1.55)]`}>
          <li>Director / Producer / Editor</li>
          <li>{STATUS}</li>
          <li>
            <a
              href={`mailto:${EMAIL}`}
              className="normal-case underline decoration-foreground/25 decoration-dotted underline-offset-4 transition-colors hover:decoration-foreground"
            >
              {EMAIL}
            </a>
          </li>
        </ul>
      </section>

      <h2 className={`${mono} mt-10 mb-4 sm:mt-14 sm:mb-5`}>Selected Work</h2>
      <FilmGrid films={getWorkFilms()} />
    </main>
  );
}
