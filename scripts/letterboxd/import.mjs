// Build src/data/films.json from a Letterboxd data export.
//
//   node scripts/letterboxd/import.mjs path/to/unzipped-export
//
// Reads only watched, ratings, diary and liked films. Reviews, tags and
// profile data are never read, so nothing personal ends up in the repo.
// Existing TMDB poster matches in films.json are preserved.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const dir = process.argv[2];
if (!dir) throw new Error("Usage: node scripts/letterboxd/import.mjs <export dir>");
const OUT = "src/data/films.json";

function parseCsv(text) {
  const rows = [];
  let row = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); rows.push(row); row = []; field = "";
    } else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const [header, ...body] = rows.filter((r) => r.some(Boolean));
  return body.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ""])));
}

const read = (file) => parseCsv(readFileSync(join(dir, file), "utf8"));
const watched = read("watched.csv");
const ratings = new Map(read("ratings.csv").map((r) => [r["Letterboxd URI"], Number(r.Rating)]));
const liked = new Set(read("likes/films.csv").map((r) => r["Letterboxd URI"]));

// Diary rows link to the log entry, not the film, so join on title + year
const lastWatched = new Map();
for (const r of read("diary.csv")) {
  const key = `${r.Name}\u0000${r.Year}`;
  const date = r["Watched Date"] || r.Date;
  if (date > (lastWatched.get(key) ?? "")) lastWatched.set(key, date);
}

const previous = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")).films ?? [] : [];
const posters = new Map(previous.map((f) => [f.uri, { tmdbId: f.tmdbId, poster: f.poster }]));

const films = watched.map((r) => {
  const uri = r["Letterboxd URI"];
  return {
    title: r.Name,
    year: r.Year ? Number(r.Year) : null,
    uri,
    rating: ratings.get(uri) ?? null,
    watched: lastWatched.get(`${r.Name}\u0000${r.Year}`) ?? null,
    liked: liked.has(uri),
    ...(posters.get(uri) ?? {}),
  };
});

films.sort((a, b) =>
  a.watched && b.watched ? b.watched.localeCompare(a.watched)
  : a.watched || b.watched ? (a.watched ? -1 : 1)
  : a.title.localeCompare(b.title),
);

// Latest activity in the export; the live feed only overrides entries newer than this
const exportedAt = [watched, read("ratings.csv"), read("diary.csv")]
  .flat()
  .map((r) => r["Watched Date"] > r.Date ? r["Watched Date"] : r.Date)
  .filter(Boolean)
  .sort()
  .at(-1);

writeFileSync(OUT, JSON.stringify({ exportedAt, films }, null, 1) + "\n");
console.log(`exported ${exportedAt}: ${films.length} films -> ${OUT} (${films.filter((f) => f.rating).length} rated, ${films.filter((f) => f.watched).length} dated, ${films.filter((f) => f.rating === 5).length} five-star)`);
