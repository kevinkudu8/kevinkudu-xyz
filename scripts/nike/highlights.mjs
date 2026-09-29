// Build src/data/run-highlights.json: one run from each chosen city (its
// longest), as route drawings coloured by pace over a street map.
//
//   npm run nike:highlights     (also runs at the end of `npm run nike`)
//
// Reads the raw activities cached by import.mjs in .nike/. Cities are named
// with OpenStreetMap's Nominatim from each run's start point rounded to about
// 1 km (cached in .nike/cities.json, so only new places are looked up).
//
// Privacy: each route loses its first and last 400 m, so it doesn't show where
// a run started or ended, and it's stored as a drawing in its own box, not as
// coordinates.
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const CACHE = ".nike";
const OUT = "src/data/run-highlights.json";
const TRIM_KM = 0.4;
const BUCKETS = 3; // pace colours: slower, steady, faster
const BOX = 100;
const MAPS = "public/run-maps";
// The street map under each route is drawn from OpenStreetMap data (via the
// Overpass API, cached in .nike/osm/), as one SVG per layer: major roads,
// minor roads and water. The site uses them as masks and colours them
// itself, so they follow the light and dark themes.
// Public Overpass servers, tried in turn when one is busy
const OVERPASS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

// The cities shown, one run each (its longest there), ordered by distance
const CITIES = [
  "Toronto",
  "Montreal",
  "New York",
  "Las Vegas",
  "Seoul",
  "Tokyo",
  "Kyoto",
  "Lisbon",
  "Paris",
  "Barcelona",
  "Oaxaca",
  "Mexico City",
  "Singapore",
  "Bogotá",
];

// Nominatim names some places by their district or county; show the city people know
const RENAME = {
  "Clark County": "Las Vegas",
  Shibuya: "Tokyo",
  Minato: "Tokyo",
  Chuo: "Tokyo",
  "Esplugues de Llobregat": "Barcelona",
  "l'Hospitalet de Llobregat": "Barcelona",
  Bogota: "Bogotá",
  "Gwangju-si": "Gwangju",
  "Bogota, Capital District": "Bogotá",
  "Seongnam-si": "Seongnam",
  "Gimpo-si": "Gimpo",
  "The Blue Mountains": "Blue Mountains",
  "Havelock-Belmont-Methuen": "Havelock",
  "Oaxaca City": "Oaxaca",
};

const metric = (a, type) => a.metrics?.find((m) => m.type === type)?.values ?? [];
const RAD = Math.PI / 180;
function haversine(lat1, lon1, lat2, lon2) {
  const dLat = (lat2 - lat1) * RAD;
  const dLon = (lon2 - lon1) * RAD;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * RAD) * Math.cos(lat2 * RAD) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(x));
}

/** Paused stretches of a run, from its halt moments. */
function pauses(a) {
  const halts = (a.moments ?? []).filter((m) => m.key === "halt").sort((x, y) => x.timestamp - y.timestamp);
  const spans = [];
  let from = null;
  for (const h of halts) {
    if ((h.value === "pause" || h.value === "auto_pause") && from === null) from = h.timestamp;
    if ((h.value === "resume" || h.value === "auto_resume") && from !== null) {
      spans.push([from, h.timestamp]);
      from = null;
    }
  }
  if (from !== null) spans.push([from, Infinity]);
  return spans;
}

/** GPS points while moving, with distance along the route and moving time. */
function track(a) {
  const lat = metric(a, "latitude");
  const lon = metric(a, "longitude");
  const spans = pauses(a);
  const inPause = (ms) => spans.some(([p, r]) => ms >= p && ms < r);
  const points = [];
  let km = 0;
  let secs = 0;
  let prev = null;
  let gap = false;
  for (let i = 0; i < Math.min(lat.length, lon.length); i++) {
    const ms = lat[i].start_epoch_ms;
    if (inPause(ms)) {
      prev = null; // don't count the jump across a pause as running
      gap = true;
      continue;
    }
    const p = { lat: lat[i].value, lon: lon[i].value, ms };
    if (prev) {
      const step = haversine(prev.lat, prev.lon, p.lat, p.lon);
      const dt = (ms - prev.ms) / 1000;
      // A GPS jump (> 43 km/h) or a long dropout: don't draw a straight line across it
      if (step / Math.max(dt, 1) > 0.012 || dt > 60) {
        prev = p;
        gap = true;
        continue;
      }
      km += step;
      secs += dt;
    }
    points.push({ ...p, km, secs, gap });
    gap = false;
    prev = p;
  }
  return points;
}

/** Speed around each point, over about 400 m either side, so the colours change in bands, not flickers. */
function speeds(points) {
  const out = [];
  let lo = 0;
  let hi = 0;
  for (let i = 0; i < points.length; i++) {
    while (points[i].km - points[lo].km > 0.4) lo++;
    while (hi + 1 < points.length && points[hi + 1].km - points[i].km <= 0.4) hi++;
    const dk = points[hi].km - points[lo].km;
    const dt = points[hi].secs - points[lo].secs;
    out.push(dt > 0 ? dk / dt : 0);
  }
  return out;
}

/** Douglas–Peucker, on [x, y] points. */
function simplify(pts, tolerance) {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    const [ax, ay] = pts[a];
    const [bx, by] = pts[b];
    const len = Math.hypot(bx - ax, by - ay) || 1;
    let far = -1;
    let dist = tolerance;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs((bx - ax) * (ay - pts[i][1]) - (ax - pts[i][0]) * (by - ay)) / len;
      if (d > dist) {
        dist = d;
        far = i;
      }
    }
    if (far > 0) {
      keep[far] = 1;
      stack.push([a, far], [far, b]);
    }
  }
  return pts.filter((_, i) => keep[i]);
}

const r1 = (n) => Math.round(n * 10) / 10;

/** The route as SVG path data, one path per pace colour. */
function drawing(a) {
  const all = track(a);
  const total = all.at(-1)?.km ?? 0;
  const points = all.filter((p) => p.km >= TRIM_KM && p.km <= total - TRIM_KM);
  if (points.length < 10) return null;
  const v = speeds(points);
  // Colour by where each stretch sits in this run's own range of speeds
  const sorted = [...v].sort((x, y) => x - y);
  const q = (f) => sorted[Math.floor(f * (sorted.length - 1))];
  const lo = q(0.05);
  const hi = q(0.95);
  const bucket = (s) => Math.max(0, Math.min(BUCKETS - 1, Math.floor(((s - lo) / (hi - lo || 1)) * BUCKETS)));

  // Web Mercator (0–1 across the world), so the route lines up with map tiles
  const merc = (p) => {
    const sin = Math.sin(p.lat * RAD);
    return [(p.lon + 180) / 360, 0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)];
  };
  const xy = points.map(merc);
  const xs = xy.map((p) => p[0]);
  const ys = xy.map((p) => p[1]);
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  // A square view around the route, with room below for the label
  const span = Math.max(maxX - minX, maxY - minY) / 0.74;
  const view = { x: (minX + maxX) / 2 - span / 2, y: (minY + maxY) / 2 - span * 0.44 };
  const proj = xy.map(([x, y]) => [((x - view.x) / span) * BOX, ((y - view.y) / span) * BOX]);

  // Consecutive points of the same colour become one stretch; stretches share an end point
  const stretches = [];
  let current = null;
  proj.forEach((p, i) => {
    const b = bucket(v[i]);
    if (!current || current.b !== b || points[i].gap) {
      // Join to the previous stretch, unless there was a pause or dropout between them
      const start = current && !points[i].gap ? [current.pts.at(-1)] : [];
      current = { b, pts: [...start, p] };
      stretches.push(current);
    } else current.pts.push(p);
  });
  const paths = Array.from({ length: BUCKETS }, () => []);
  for (const s of stretches) {
    const pts = simplify(s.pts, 0.25);
    if (pts.length < 2) continue;
    paths[s.b].push(`M${pts.map(([x, y]) => `${r1(x)} ${r1(y)}`).join("L")}`);
  }
  return { paths: paths.map((p) => p.join("")), view: { ...view, span } };
}

// ---------- street map ----------

const MAJOR = ["motorway", "trunk", "primary", "secondary", "motorway_link", "trunk_link", "primary_link"];
const MINOR = ["tertiary", "residential", "unclassified", "living_street", "pedestrian", "service", "footway", "path", "cycleway"];

/** Every way needed for the map around `view`, from Overpass (cached per run). */
async function osm(id, view) {
  mkdirSync(join(CACHE, "osm"), { recursive: true });
  const file = join(CACHE, "osm", `${id}.json`);
  if (existsSync(file)) return JSON.parse(readFileSync(file, "utf8"));
  const unmerc = (x, y) => [
    (Math.atan(Math.sinh(Math.PI * (1 - 2 * y))) * 180) / Math.PI,
    x * 360 - 180,
  ];
  const [n, w] = unmerc(view.x, view.y);
  const [s, e] = unmerc(view.x + view.span, view.y + view.span);
  const bbox = `${s.toFixed(5)},${w.toFixed(5)},${n.toFixed(5)},${e.toFixed(5)}`;
  // Over big areas, only the bigger streets, or the map turns to felt
  const spanKm = haversine(n, w, n, e);
  const minor = spanKm < 9 ? MINOR : MINOR.slice(0, 3);
  const query = `[out:json][timeout:90];
(
  way["highway"~"^(${[...MAJOR, ...minor].join("|")})$"](${bbox});
  way["natural"="water"](${bbox});
  way["waterway"~"^(river|canal|riverbank)$"](${bbox});
  relation["natural"="water"](${bbox});
);
out geom(${bbox});`;
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(OVERPASS[(attempt - 1) % OVERPASS.length], {
      method: "POST",
      body: new URLSearchParams({ data: query }),
      headers: { "User-Agent": "kevinkudu.xyz run highlights (personal site)" },
      signal: AbortSignal.timeout(120_000),
    }).catch(() => ({ ok: false, status: "timeout" }));
    if (res.ok) {
      const data = await res.json();
      writeFileSync(file, JSON.stringify(data));
      await new Promise((r) => setTimeout(r, 2000));
      return data;
    }
    if (attempt >= 6) throw new Error(`Overpass ${res.status}`);
    await new Promise((r) => setTimeout(r, 5000));
  }
}

/** The four map layers for a run, as SVG files in the same 100-unit box as the route. */
async function streetMap(id, view) {
  const data = await osm(id, view);
  const at = ({ lat, lon }) => {
    const sin = Math.sin(lat * RAD);
    const x = (lon + 180) / 360;
    const y = 0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI);
    return [((x - view.x) / view.span) * BOX, ((y - view.y) / view.span) * BOX];
  };
  // Footpaths and service lanes are far too fine to see at this size
  const SKIP = new Set(["service", "footway", "path", "cycleway"]);
  const inView = ([x, y]) => x > -5 && x < BOX + 5 && y > -5 && y < BOX + 5;
  const line = (geometry, minLength = 0) => {
    const pts = simplify(geometry.filter(Boolean).map(at), 0.22);
    if (pts.length < 2 || !pts.some(inView)) return "";
    const length = pts.reduce((sum, p, i) => (i ? sum + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0), 0);
    if (length < minLength) return "";
    return `M${pts.map(([x, y]) => `${Math.round(x * 10) / 10} ${Math.round(y * 10) / 10}`).join("L")}`;
  };
  const layers = { major: [], minor: [], water: [], rivers: [] };
  for (const el of data.elements ?? []) {
    const t = el.tags ?? {};
    // Areas: closed ways, or the outer rings of relations (as far as they lie in view)
    const rings =
      el.type === "way"
        ? [el.geometry ?? []]
        : (el.members ?? []).filter((m) => m.role === "outer" && m.geometry).map((m) => m.geometry);
    if (t.highway) {
      if (SKIP.has(t.highway)) continue;
      (MAJOR.includes(t.highway) ? layers.major : layers.minor).push(line(el.geometry ?? [], 1.5));
    } else if (t.waterway === "river" || t.waterway === "canal") {
      layers.rivers.push(line(el.geometry ?? []));
    } else if (t.natural === "water" || t.waterway === "riverbank") {
      layers.water.push(...rings.map((r) => line(r, 2)).filter(Boolean).map((d) => `${d}Z`));
    }
  }
  const svg = (body) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${BOX} ${BOX}">${body}</svg>\n`;
  const strokes = (paths, width) =>
    `<path d="${paths.filter(Boolean).join("")}" fill="none" stroke="#000" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const fills = (paths) => `<path d="${paths.join("")}" fill="#000" fill-rule="evenodd"/>`;
  mkdirSync(MAPS, { recursive: true });
  const files = {
    major: svg(strokes(layers.major, 0.7)),
    minor: svg(strokes(layers.minor, 0.3)),
    water: svg(fills(layers.water) + strokes(layers.rivers, 1.2)),
  };
  for (const [layer, body] of Object.entries(files)) writeFileSync(join(MAPS, `${id}-${layer}.svg`), body);
  return Object.fromEntries(Object.keys(files).map((layer) => [layer, `/run-maps/${id}-${layer}.svg`]));
}

// ---------- cities ----------

async function cityOf(lat, lon, cache) {
  const key = `${lat.toFixed(2)},${lon.toFixed(2)}`;
  if (!cache[key]) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=10&accept-language=en&lat=${lat.toFixed(2)}&lon=${lon.toFixed(2)}`;
    const res = await fetch(url, { headers: { "User-Agent": "kevinkudu.xyz run highlights (personal site)" } });
    if (!res.ok) throw new Error(`Nominatim ${res.status}`);
    const j = await res.json();
    const ad = j.address ?? {};
    cache[key] = {
      city: ad.city ?? ad.town ?? ad.village ?? ad.municipality ?? ad.county ?? ad.state ?? j.name,
      cc: ad.country_code?.toUpperCase() ?? "",
    };
    await new Promise((r) => setTimeout(r, 1100)); // Nominatim's limit is one request a second
  }
  const { city, cc } = cache[key];
  return { city: RENAME[city] ?? city, cc };
}

// ---------- main ----------

export async function buildHighlights() {
  const runs = new Map(JSON.parse(readFileSync("src/data/runs.json", "utf8")).map((r) => [r.id, r]));
  const citiesFile = join(CACHE, "cities.json");
  const cache = existsSync(citiesFile) ? JSON.parse(readFileSync(citiesFile, "utf8")) : {};

  // Each run is named by where it started, rounded to about 1 km
  const candidates = [];
  for (const f of readdirSync(join(CACHE, "activities"))) {
    const a = JSON.parse(readFileSync(join(CACHE, "activities", f), "utf8"));
    const run = runs.get(a.id);
    const lat = metric(a, "latitude");
    const lon = metric(a, "longitude");
    if (!run || lat.length < 10) continue;
    const { city, cc } = await cityOf(lat[0].value, lon[0].value, cache);
    candidates.push({ run, a, city, cc });
  }
  writeFileSync(citiesFile, JSON.stringify(cache, null, 2));

  const byCity = new Map();
  for (const c of candidates) {
    if (!CITIES.includes(c.city)) continue;
    if (!byCity.has(c.city) || c.run.km > byCity.get(c.city).run.km) byCity.set(c.city, c);
  }
  const chosen = [...byCity.values()].sort((x, y) => y.run.km - x.run.km);
  const missing = CITIES.filter((city) => !byCity.has(city));
  if (missing.length) console.warn(`No runs found for: ${missing.join(", ")}`);

  const country = new Intl.DisplayNames("en", { type: "region" });
  const out = [];
  rmSync(MAPS, { recursive: true, force: true });
  for (const c of chosen) {
    const drawn = drawing(c.a);
    if (!drawn) continue;
    const map = await streetMap(c.run.id, drawn.view);
    out.push({
      id: c.run.id,
      city: c.city,
      country: c.cc === "US" ? "USA" : c.cc ? country.of(c.cc) : "",
      km: c.run.km,
      paths: drawn.paths,
      map,
    });
  }
  writeFileSync(OUT, `${JSON.stringify(out)}\n`);
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const out = await buildHighlights();
  console.log(`Wrote ${OUT}: ${out.length} runs`);
}
