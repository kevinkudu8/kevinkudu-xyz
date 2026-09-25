// Match films in src/data/films.json to TMDB and record their poster paths.
//
//   node --env-file=.env.local scripts/letterboxd/posters.mjs
//
// Only films never searched before are looked up; `tmdbId: null` marks a film
// that was searched and not confidently matched. Delete that key to retry.
import { readFileSync, writeFileSync } from "node:fs";

const FILE = "src/data/films.json";
const token = process.env.TMDB_TOKEN;
if (!token) throw new Error("TMDB_TOKEN is not set (see .env.local)");

const data = JSON.parse(readFileSync(FILE, "utf8"));
const { films } = data;
const todo = films.filter((f) => !("tmdbId" in f));
const normalise = (s = "") => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]/g, "");

async function search(params) {
  const url = new URL("https://api.themoviedb.org/3/search/movie");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(15_000) });
  if (res.status === 429) { await new Promise((r) => setTimeout(r, 2000)); return search(params); }
  if (!res.ok) throw new Error(`TMDB ${res.status}: ${await res.text()}`);
  return (await res.json()).results ?? [];
}

// A wrong poster is worse than none: require the title to match exactly
// (normalised), and the release year to be within a year of Letterboxd's.
function pick(results, film) {
  const want = normalise(film.title);
  return results.find((r) => {
    const titles = [r.title, r.original_title].map(normalise);
    const year = Number((r.release_date ?? "").slice(0, 4));
    return titles.includes(want) && (!film.year || !year || Math.abs(year - film.year) <= 1);
  });
}

let done = 0;
let i = 0;
await Promise.all(Array.from({ length: 8 }, async () => {
  while (i < todo.length) {
    const film = todo[i++];
    let hit = film.year ? pick(await search({ query: film.title, primary_release_year: film.year }), film) : undefined;
    hit ??= pick(await search({ query: film.title }), film);
    film.tmdbId = hit?.id ?? null;
    if (hit?.poster_path) film.poster = hit.poster_path;
    if (++done % 100 === 0) console.log(`${done}/${todo.length}`);
  }
}));

writeFileSync(FILE, JSON.stringify(data, null, 1) + "\n");
const missing = films.filter((f) => !f.poster);
console.log(`posters: ${films.length - missing.length}/${films.length}`);
if (missing.length) console.log("no poster:", missing.map((f) => `${f.title} (${f.year})`).join(" | "));
