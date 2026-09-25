import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { parseFrontmatter } from "@/lib/frontmatter";

// Each event is a folder in public/events: event.md plus images (see the
// README there). The folder name is the event's link.
const ROOT = join(process.cwd(), "public", "events");
const IMAGE = /\.(jpe?g|png|webp|avif)$/i;

export type EventEntry = {
  slug: string;
  title: string;
  featured: boolean;
  /** Placeholder details; shows a "Sample content" tag */
  sample: boolean;
  details: { label: string; value: string }[];
  stats: { value: string; label: string }[];
  paragraphs: string[];
  images: string[];
};

const DETAILS = [
  ["client", "Client"],
  ["role", "Role"],
  ["location", "Location"],
  ["year", "Year"],
] as const;

// "1,650 = Sign-ups; 22M = Impressions"
const parseStats = (value = "") =>
  value
    .split(";")
    .map((pair) => pair.split("="))
    .filter((parts) => parts.length === 2 && parts[0].trim() && parts[1].trim())
    .map(([v, label]) => ({ value: v.trim(), label: label.trim() }));

export function getEvents(): EventEntry[] {
  const folders = readdirSync(ROOT).filter((name) => statSync(join(ROOT, name)).isDirectory());

  return folders
    .map((slug) => {
      const dir = join(ROOT, slug);
      const files = readdirSync(dir);
      const md = files.includes("event.md") ? readFileSync(join(dir, "event.md"), "utf8") : "";
      const { meta, paragraphs } = parseFrontmatter(md);
      return {
        order: Number(meta.order ?? Infinity),
        entry: {
          slug,
          title: meta.title || slug.replace(/-/g, " "),
          featured: meta.featured === "true",
          sample: meta.sample === "true",
          details: DETAILS.filter(([key]) => meta[key]).map(([key, label]) => ({ label, value: meta[key] })),
          stats: parseStats(meta.stats),
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
