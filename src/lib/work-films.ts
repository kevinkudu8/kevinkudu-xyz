import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { parseFrontmatter } from "@/lib/frontmatter";

// One folder per film in public/content (see the README there).
const ROOT = join(process.cwd(), "public", "content");

export type WorkFilm = {
  slug: string;
  title: string;
  sample: boolean;
  details: string[];
  description: string;
  poster: string | null;
  preview: string | null;
  video: string | null;
  link: string | null;
};

export function getWorkFilms(): WorkFilm[] {
  const file = (slug: string, name: string) =>
    existsSync(join(ROOT, slug, name)) ? `/content/${slug}/${name}` : null;

  return readdirSync(ROOT)
    .filter((slug) => statSync(join(ROOT, slug)).isDirectory())
    .map((slug) => {
      const md = join(ROOT, slug, "film.md");
      const { meta, paragraphs } = parseFrontmatter(existsSync(md) ? readFileSync(md, "utf8") : "");
      return {
        order: Number(meta.order ?? Infinity),
        film: {
          slug,
          title: meta.title || slug.replace(/-/g, " "),
          sample: meta.sample === "true",
          details: [meta.type, meta.role, meta.year, meta.runtime].filter(Boolean) as string[],
          description: paragraphs.join(" "),
          poster: file(slug, "poster.jpg") ?? file(slug, "poster.png"),
          preview: file(slug, "preview.mp4"),
          video: file(slug, "video.mp4"),
          link: meta.link || null,
        },
      };
    })
    .sort((a, b) => a.order - b.order || a.film.title.localeCompare(b.film.title))
    .map(({ film }) => film);
}
