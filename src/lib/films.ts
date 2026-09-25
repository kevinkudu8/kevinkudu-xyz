import { cacheLife } from "next/cache";
import data from "@/data/films.json";

const USERNAME = "kevinkudu";
const FEED = `https://letterboxd.com/${USERNAME}/rss/`;

export type Film = {
  title: string;
  year: number | null;
  /** Letterboxd film link */
  href: string;
  /** 0.5–5 stars */
  rating: number | null;
  watched: string | null;
  poster: string | null;
};

type Row = {
  title: string;
  year: number | null;
  uri: string;
  rating: number | null;
  watched: string | null;
  tmdbId?: number | null;
  poster?: string;
};

const key = (title: string, year: number | null) => `${title.toLowerCase()}|${year ?? ""}`;
const posterUrl = (path: string) => `https://image.tmdb.org/t/p/w342${path}`;

/**
 * Films from the Letterboxd export (src/data/films.json), updated with the
 * live RSS feed so anything logged since the export shows up within the hour.
 */
export async function getFilms(): Promise<Film[]> {
  "use cache";
  cacheLife("hours");

  const films = new Map<string, Row>(
    (data.films as Row[]).map((row) => [key(row.title, row.year), { ...row }]),
  );

  for (const entry of await readFeed()) {
    const k = key(entry.title, entry.year);
    const known = films.get(k);
    if (!known) {
      films.set(k, entry);
      continue;
    }
    known.tmdbId ??= entry.tmdbId;
    // Diary entries keep the rating from that watch; the export holds the film's
    // current rating. Only activity after the export is newer information.
    if (!entry.watched || entry.watched <= data.exportedAt) continue;
    if (entry.rating !== null) known.rating = entry.rating;
    if (entry.watched > (known.watched ?? "")) known.watched = entry.watched;
  }

  const rows = [...films.values()];
  const resolved = await Promise.all(
    rows.map(async (row) => ({
      title: row.title,
      year: row.year,
      href: row.uri,
      rating: row.rating,
      watched: row.watched,
      poster: row.poster
        ? posterUrl(row.poster)
        : row.tmdbId
          ? await posterFor(row.tmdbId)
          : null,
    })),
  );

  return resolved.sort((a, b) =>
    a.watched && b.watched
      ? b.watched.localeCompare(a.watched)
      : a.watched || b.watched
        ? a.watched
          ? -1
          : 1
        : a.title.localeCompare(b.title),
  );
}

const decode = (s: string) =>
  s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");

/** Diary entries from the RSS feed. The description (review text) is never read. */
async function readFeed(): Promise<Row[]> {
  try {
    const res = await fetch(FEED, {
      headers: { "User-Agent": "kevinkudu.xyz" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();

    return xml
      .split("<item>")
      .slice(1)
      .flatMap((item) => {
        const tag = (name: string) => {
          const m = item.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`));
          return m ? decode(m[1]).trim() : null;
        };
        const title = tag("letterboxd:filmTitle");
        if (!title) return []; // lists and other non-film items
        const year = Number(tag("letterboxd:filmYear")) || null;
        const rating = Number.parseFloat(tag("letterboxd:memberRating") ?? "");
        const tmdbId = Number(tag("tmdb:movieId")) || null;
        // Entry links look like /kevinkudu/film/<slug>/[n/]; link to the film itself
        const slug = tag("link")?.match(/\/film\/([^/]+)\//)?.[1];
        return [
          {
            title,
            year,
            uri: slug ? `https://letterboxd.com/film/${slug}/` : `https://letterboxd.com/${USERNAME}/`,
            rating: Number.isFinite(rating) ? rating : null,
            watched: tag("letterboxd:watchedDate"),
            tmdbId,
          },
        ];
      });
  } catch (error) {
    console.warn("[films] Letterboxd feed unavailable, using export only:", error);
    return [];
  }
}

/** Poster for a film logged after the export, by the TMDB id the feed provides. */
async function posterFor(tmdbId: number): Promise<string | null> {
  "use cache";
  cacheLife("max");

  const token = process.env.TMDB_TOKEN;
  if (!token) return null;
  try {
    const res = await fetch(`https://api.themoviedb.org/3/movie/${tmdbId}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) return null;
    const { poster_path } = (await res.json()) as { poster_path?: string | null };
    return poster_path ? posterUrl(poster_path) : null;
  } catch {
    return null;
  }
}
