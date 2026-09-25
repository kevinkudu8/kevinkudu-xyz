import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

// Each event is a folder in public/events: event.md plus images (see the
// README there). The folder name is the event's link.
const ROOT = join(process.cwd(), "public", "events");
const IMAGE = /\.(jpe?g|png|webp|avif)$/i;

export type EventEntry = {
  slug: string;
  title: string;
  featured: boolean;
  paragraphs: string[];
  images: string[];
};

function parse(markdown: string) {
  const match = markdown.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  const meta: Record<string, string> = {};
  for (const line of (match?.[1] ?? "").split("\n")) {
    const [key, ...rest] = line.split(":");
    if (key?.trim() && rest.length) meta[key.trim()] = rest.join(":").trim();
  }
  const body = (match ? match[2] : markdown).trim();
  return { meta, paragraphs: body ? body.split(/\n\s*\n/).map((p) => p.replace(/\s+/g, " ").trim()) : [] };
}

export function getEvents(): EventEntry[] {
  const folders = readdirSync(ROOT).filter((name) => statSync(join(ROOT, name)).isDirectory());

  return folders
    .map((slug) => {
      const dir = join(ROOT, slug);
      const files = readdirSync(dir);
      const md = files.includes("event.md") ? readFileSync(join(dir, "event.md"), "utf8") : "";
      const { meta, paragraphs } = parse(md);
      return {
        order: Number(meta.order ?? Infinity),
        entry: {
          slug,
          title: meta.title || slug.replace(/-/g, " "),
          featured: meta.featured === "true",
          paragraphs,
          images: files
            .filter((f) => IMAGE.test(f))
            .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
            .map((f) => `/events/${slug}/${f}`),
        },
      };
    })
    .sort((a, b) => a.order - b.order || a.entry.title.localeCompare(b.entry.title))
    .map(({ entry }) => entry);
}
