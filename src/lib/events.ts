import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { cacheLife } from "next/cache";
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
  /** Stages of the work, e.g. Concept → Creative → Production → Reporting */
  scope: string[];
  stats: { value: string; label: string }[];
  /** "What we built": the pieces of the event */
  parts: { title: string; text: string }[];
  paragraphs: string[];
  images: { src: string; width: number; height: number }[];
  /** Short silent loop for the top of the page, with its first frame as a poster */
  loop: string | null;
  poster: string | null;
  /** The full film, played on request */
  film: string | null;
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

// "Title = text; Title = text"
const parseParts = (value = "") =>
  value
    .split(";")
    .map((pair) => {
      const at = pair.indexOf("=");
      return at < 0 ? null : { title: pair.slice(0, at).trim(), text: pair.slice(at + 1).trim() };
    })
    .filter((part): part is { title: string; text: string } => Boolean(part?.title && part.text));

/** Pixel size from a JPEG or PNG header, so photos can keep their shape. */
function imageSize(path: string): { width: number; height: number } {
  const buf = readFileSync(path);
  if (buf.readUInt32BE(0) === 0x89504e47) return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  let i = 2;
  while (i < buf.length) {
    const marker = buf[i + 1];
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { width: buf.readUInt16BE(i + 7), height: buf.readUInt16BE(i + 5) };
    }
    i += 2 + buf.readUInt16BE(i + 2);
  }
  return { width: 16, height: 9 };
}

/**
 * A fingerprint of the events folder (file names and modified times). Passed to
 * getEvents so the cache is keyed on the content: edit a file and it rebuilds.
 */
export function eventsVersion(): string {
  let latest = 0;
  let count = 0;
  for (const slug of readdirSync(ROOT)) {
    const dir = join(ROOT, slug);
    if (!statSync(dir).isDirectory()) continue;
    for (const file of readdirSync(dir)) {
      latest = Math.max(latest, statSync(join(dir, file)).mtimeMs);
      count++;
    }
  }
  return `${count}:${latest}`;
}

// Cached (keyed on the folder's fingerprint) so file reads stay out of each render
export async function getEvents(version: string): Promise<EventEntry[]> {
  "use cache";
  cacheLife("max");
  void version;

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
          scope: (meta.scope ?? "").split(";").map((s) => s.trim()).filter(Boolean),
          details: DETAILS.filter(([key]) => meta[key]).map(([key, label]) => ({ label, value: meta[key] })),
          stats: parseStats(meta.stats),
          parts: parseParts(meta.parts),
          paragraphs,
          images: files
            .filter((f) => IMAGE.test(f) && f !== "poster.jpg")
            .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
            .map((f) => ({ src: `/events/${slug}/${f}`, ...imageSize(join(dir, f)) })),
          loop: existsSync(join(dir, "loop.mp4")) ? `/events/${slug}/loop.mp4` : null,
          poster: existsSync(join(dir, "poster.jpg")) ? `/events/${slug}/poster.jpg` : null,
          film: existsSync(join(dir, "film.mp4")) ? `/events/${slug}/film.mp4` : null,
        },
      };
    })
    .sort((a, b) => a.order - b.order || a.entry.title.localeCompare(b.entry.title))
    .map(({ entry }) => entry);
}
