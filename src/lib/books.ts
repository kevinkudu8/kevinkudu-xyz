import { cacheLife } from "next/cache";
import coverIds from "@/data/book-covers.json";
import { airtableConfig, listRecords } from "@/lib/airtable";

export type Book = {
  id: string;
  title: string;
  author: string;
  rating: number | null;
  year: number | null;
  favourite: boolean;
  cover: string | null;
  /** Cover width / height, when known, so it can be drawn uncropped */
  aspect: number | null;
};

type BookFields = {
  Title?: string;
  Author?: string;
  Rating?: string;
  Date?: string;
  Favourites?: boolean;
  Attachments?: { id: string; width?: number; height?: number }[];
};

// Notes is deliberately absent: they're personal and must never reach the site.
const FIELDS = ["Title", "Author", "Rating", "Date", "Favourites", "Attachments"] as const;

// Books logged as 2021-01-01 were read before tracking started; show them undated.
const PLACEHOLDER_DATE = "2021-01-01";

type KnownCover = { id: number; w?: number; h?: number } | null;
const knownCovers: Record<string, KnownCover> = coverIds;
const openLibraryCover = (id: number) => `https://covers.openlibrary.org/b/id/${id}-L.jpg`;
const tidy = (s = "") => s.replace(/\s+/g, " ").replace(/ ,/g, ",").trim();

export async function getBooks(): Promise<Book[]> {
  "use cache";
  cacheLife("hours");

  const tableId = process.env.AIRTABLE_TABLE_ID;
  if (!airtableConfig() || !tableId) {
    console.warn("[books] Airtable env vars missing; rendering an empty shelf");
    return [];
  }

  const records = await listRecords<BookFields>(tableId, FIELDS);

  const books = await Promise.all(
    records.map(async ({ id, fields: f }) => {
      const title = tidy(f.Title).replace(/\s*#\d+$/, "");
      const author = tidy(f.Author);
      const rating = Number.parseFloat(f.Rating ?? "");
      const date = f.Date && f.Date !== PLACEHOLDER_DATE ? f.Date : null;

      // An image attached in Airtable wins, so any cover can be swapped by hand
      let cover: string | null = null;
      let aspect: number | null = null;
      const attached = f.Attachments?.[0];
      const known = knownCovers[id];
      if (attached) {
        cover = `/covers/${id}`;
        if (attached.width && attached.height) aspect = attached.width / attached.height;
      } else if (known) {
        cover = openLibraryCover(known.id);
        if (known.w && known.h) aspect = known.w / known.h;
      } else if (!(id in knownCovers)) {
        cover = await findCover(title, author);
      }

      const book: Book = {
        id,
        title,
        author,
        rating: Number.isFinite(rating) ? rating : null,
        year: date ? Number(date.slice(0, 4)) : null,
        favourite: Boolean(f.Favourites),
        cover,
        aspect,
      };
      return { book, date };
    }),
  );

  // Newest first; undated books after, alphabetically
  books.sort((a, b) => {
    if (a.date && b.date) return b.date.localeCompare(a.date);
    if (a.date || b.date) return a.date ? -1 : 1;
    return a.book.title.localeCompare(b.book.title);
  });
  return books.map(({ book }) => book);
}

/**
 * Strict Open Library lookup for books added after src/data/book-covers.json
 * was generated. Only accepts a result whose title matches, since a wrong
 * cover is worse than none.
 */
async function findCover(title: string, author: string): Promise<string | null> {
  "use cache";
  cacheLife("max");

  const base = title.replace(/\s*[:;(].*$/, "").trim();
  const normalise = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  try {
    const url = new URL("https://openlibrary.org/search.json");
    url.searchParams.set("title", base);
    if (author) url.searchParams.set("author", author.split(",")[0]);
    url.searchParams.set("fields", "title,cover_i");
    url.searchParams.set("limit", "5");
    const res = await fetch(url, {
      headers: { "User-Agent": "kevinkudu.xyz bookshelf" },
      signal: AbortSignal.timeout(4_000),
    });
    if (!res.ok) return null;
    const { docs } = (await res.json()) as { docs: { title: string; cover_i?: number }[] };
    const hit = docs.find(
      (d) => d.cover_i && normalise(d.title).startsWith(normalise(base).slice(0, 12)),
    );
    return hit?.cover_i ? openLibraryCover(hit.cover_i) : null;
  } catch {
    return null;
  }
}
