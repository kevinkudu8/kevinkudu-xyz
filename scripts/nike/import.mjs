// Import runs from Nike Run Club.
//
//   npm run nike                      (asks for a token)
//   NIKE_TOKEN=eyJ… npm run nike
//   npm run nike -- --dry-run         (fetch and compare, write nothing to src/)
//
// Nike has no public API, so this uses the private one the NRC website uses,
// with your own login token (it expires after about an hour). To get one: log
// in at nike.com, open DevTools → Application → Local Storage →
// https://www.nike.com, find the key starting "oidc.user:https://accounts.nike.com"
// and copy the "access_token" value from it.
//
// Writes:
//   .nike/activities/<id>.json   raw activity detail, cached so reruns only fetch new runs (git-ignored)
//   .nike/gpx/<date>-<id>.gpx    a full GPX per run with GPS, elevation and heart rate (git-ignored)
//   src/data/runs.json           one line per run: date, distance, time, climb, heart rate. No GPS.
//   src/data/running.json        the Running tab's stats, computed from the runs
//   src/data/run-highlights.json route drawings for the Running tab (see highlights.mjs)
//
// GPS never goes into src/: the GPX files show where runs start and end
// (usually home), so they stay on this machine.
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createInterface } from "node:readline/promises";
import { buildHighlights } from "./highlights.mjs";

const DRY = process.argv.includes("--dry-run");
const CACHE = ".nike";
const RUNNING = "src/data/running.json";
const RUNS = "src/data/runs.json";

const LIST_FIRST =
  "https://api.nike.com/plus/v3/activities/before_id/v3/*?limit=30&types=run%2Cjogging&include_deleted=false";
const LIST_NEXT = (id) =>
  `https://api.nike.com/plus/v3/activities/before_id/v3/${id}?limit=30&types=run%2Cjogging&include_deleted=false`;
const DETAIL = (id) => `https://api.nike.com/sport/v3/me/activity/${id}?metrics=ALL`;

// ---------- token ----------

async function token() {
  let t = process.env.NIKE_TOKEN?.trim();
  if (!t) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    t = (await rl.question("Paste your Nike access token: ")).trim();
    rl.close();
  }
  // Accept the whole local-storage JSON, a "Bearer …" header, or the bare token
  const fromJson = t.match(/"access_token"\s*:\s*"([^"]+)"/)?.[1];
  t = (fromJson ?? t).replace(/^Bearer\s+/i, "").replace(/^["']|["']$/g, "");
  if (!t) throw new Error("No token given");
  return t;
}

async function get(url, auth, attempt = 1) {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${auth}`, Accept: "application/json" } });
  if (res.status === 401 || res.status === 403) {
    throw new Error(`Nike said ${res.status}: the token has expired or is wrong. Grab a fresh one and rerun.`);
  }
  if ((res.status === 429 || res.status >= 500) && attempt < 5) {
    await new Promise((r) => setTimeout(r, 1500 * attempt));
    return get(url, auth, attempt + 1);
  }
  if (!res.ok) throw new Error(`Nike ${res.status} for ${url}: ${(await res.text()).slice(0, 300)}`);
  return res.json();
}

// ---------- fetching ----------

async function listActivities(auth) {
  const all = [];
  let url = LIST_FIRST;
  while (url) {
    const page = await get(url, auth);
    all.push(...(page.activities ?? []));
    process.stdout.write(`\rListing runs… ${all.length}`);
    const next = page.paging?.before_id;
    url = next ? LIST_NEXT(next) : null;
  }
  process.stdout.write("\n");
  return all.filter((a) => (a.type ?? "run") === "run" && !a.is_deleted);
}

async function details(ids, auth) {
  mkdirSync(join(CACHE, "activities"), { recursive: true });
  const todo = ids.filter((id) => !existsSync(join(CACHE, "activities", `${id}.json`)));
  let done = 0;
  // A few at a time, to stay polite to the API
  const queue = [...todo];
  await Promise.all(
    Array.from({ length: 4 }, async () => {
      while (queue.length) {
        const id = queue.shift();
        const detail = await get(DETAIL(id), auth);
        writeFileSync(join(CACHE, "activities", `${id}.json`), JSON.stringify(detail));
        process.stdout.write(`\rFetching run details… ${++done}/${todo.length}`);
      }
    }),
  );
  if (todo.length) process.stdout.write("\n");
  return ids.map((id) => JSON.parse(readFileSync(join(CACHE, "activities", `${id}.json`), "utf8")));
}

// ---------- reading an activity ----------

const metric = (a, type) => a.metrics?.find((m) => m.type === type)?.values ?? [];
const summary = (a, name, kind) => a.summaries?.find((s) => s.metric === name && (!kind || s.summary === kind))?.value;

// Nike doesn't record a time zone, so each run is dated in the zone nearest its
// GPS start (daylight saving included). Runs without GPS take the zone of the
// run before them.
const ZONES = [
  ["America/Vancouver", -123],
  ["America/Denver", -105],
  ["America/Chicago", -88],
  ["America/Toronto", -76],
  ["America/Halifax", -63],
  ["Europe/London", -1],
  ["Europe/Paris", 6],
  ["Europe/Athens", 24],
  ["Asia/Dubai", 55],
  ["Asia/Kolkata", 78],
  ["Asia/Bangkok", 100],
  ["Asia/Singapore", 105],
  ["Asia/Hong_Kong", 115],
  ["Asia/Seoul", 127],
  ["Asia/Tokyo", 139],
  ["Australia/Sydney", 151],
];
const machineZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
let lastZone = machineZone;
function zoneFor(a) {
  const lon = metric(a, "longitude")[0]?.value;
  if (typeof lon === "number") {
    lastZone = ZONES.reduce((best, z) => (Math.abs(z[1] - lon) < Math.abs(best[1] - lon) ? z : best))[0];
  }
  return lastZone;
}
const localDate = (ms, timeZone) => new Date(ms).toLocaleDateString("en-CA", { timeZone }); // YYYY-MM-DD

/** A run's headline numbers, from its summary with the streams as a fallback. */
function summarise(a) {
  const distance = metric(a, "distance");
  const km = summary(a, "distance", "total") ?? distance.reduce((s, v) => s + v.value, 0);
  const seconds = (a.active_duration_ms ?? (a.end_epoch_ms ?? 0) - (a.start_epoch_ms ?? 0)) / 1000;
  const ascent = metric(a, "ascent").reduce((s, v) => s + v.value, 0);
  const hr = metric(a, "heart_rate");
  return {
    id: a.id,
    date: localDate(a.start_epoch_ms, zoneFor(a)),
    start: a.start_epoch_ms,
    km: round(km, 2),
    seconds: Math.round(seconds),
    ascent: ascent ? Math.round(ascent) : null,
    hr: hr.length ? Math.round(hr.reduce((s, v) => s + v.value, 0) / hr.length) : null,
    route: metric(a, "latitude").length > 1,
  };
}

/**
 * The quickest stretch of each target distance within one run, from its
 * distance stream. Time is moving time, as in the app: the phone keeps
 * logging while a run is paused, so anything inside a pause (the "halt"
 * moments, manual or auto) is left out, time and distance both.
 */
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
  if (from !== null) spans.push([from, a.end_epoch_ms ?? Infinity]);
  return spans;
}

function bestEfforts(a, targets) {
  const spans = pauses(a);
  const paused = (from, to) => spans.reduce((ms, [p, r]) => ms + Math.max(0, Math.min(to, r) - Math.max(from, p)), 0);
  // Cumulative distance and moving time at each sample boundary
  const km = [0];
  const t = [0];
  for (const s of metric(a, "distance")) {
    const length = s.end_epoch_ms - s.start_epoch_ms;
    if (length <= 0) continue;
    const moving = length - paused(s.start_epoch_ms, s.end_epoch_ms);
    if (moving <= 0) continue;
    km.push(km.at(-1) + s.value * (moving / length));
    t.push(t.at(-1) + moving / 1000);
  }
  if (km.length < 3) return {};
  const best = {};
  for (const target of targets) {
    if (km.at(-1) < target) continue;
    let i = 0;
    let quickest = Infinity;
    for (let j = 1; j < km.length; j++) {
      while (km[j] - km[i + 1] >= target) i++;
      if (km[j] - km[i] < target) continue;
      // Start the clock at the exact point the target distance began, inside sample i
      const into = (km[j] - target - km[i]) / (km[i + 1] - km[i] || 1);
      const secs = t[j] - (t[i] + (t[i + 1] - t[i]) * into);
      if (secs < quickest) quickest = secs;
    }
    if (quickest < Infinity) best[target] = quickest;
  }
  return best;
}

// ---------- GPX ----------

function gpx(a, run) {
  const lat = metric(a, "latitude");
  const lon = metric(a, "longitude");
  if (lat.length < 2) return null;
  const nearest = (values) => {
    // The value in effect at a moment, from a stream sampled at its own times
    let k = 0;
    return (ms) => {
      while (k + 1 < values.length && values[k + 1].start_epoch_ms <= ms) k++;
      return values[k]?.value;
    };
  };
  const elevationAt = metric(a, "elevation").length ? nearest(metric(a, "elevation")) : null;
  const hrAt = metric(a, "heart_rate").length ? nearest(metric(a, "heart_rate")) : null;
  const points = lat
    .map((p, i) => {
      const ms = p.start_epoch_ms;
      const ele = elevationAt?.(ms);
      const hr = hrAt?.(ms);
      return [
        `      <trkpt lat="${p.value}" lon="${lon[i]?.value}">`,
        ele != null ? `        <ele>${round(ele, 1)}</ele>` : null,
        `        <time>${new Date(ms).toISOString()}</time>`,
        hr != null
          ? `        <extensions><gpxtpx:TrackPointExtension><gpxtpx:hr>${Math.round(hr)}</gpxtpx:hr></gpxtpx:TrackPointExtension></extensions>`
          : null,
        "      </trkpt>",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");
  const name = a.tags?.["com.nike.name"] ?? `Run ${run.date}`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="kevinkudu.xyz nike import" xmlns="http://www.topografix.com/GPX/1/1" xmlns:gpxtpx="http://www.garmin.com/xmlschemas/TrackPointExtension/v1">
  <metadata><time>${new Date(run.start).toISOString()}</time></metadata>
  <trk>
    <name>${escape(name)}</name>
    <type>running</type>
    <trkseg>
${points}
    </trkseg>
  </trk>
</gpx>
`;
}

// ---------- stats for the Running tab ----------

const RECORDS = [
  { km: 1, badge: "1K", label: "Fastest 1K" },
  { km: 1.609344, badge: "1MI", label: "Fastest mile" },
  { km: 5, badge: "5K", label: "Fastest 5K" },
  { km: 10, badge: "10K", label: "Fastest 10K" },
  { km: 21.0975, badge: "21.1K", label: "Fastest half marathon" },
  { km: 42.195, badge: "42.2K", label: "Fastest marathon" },
];
/**
 * Nike computes records its own way, a few seconds off a plain split. While a
 * record still comes from the same run as before (dates within a day, since the
 * app shows dates in the phone's time zone), keep the time already on the site,
 * which was copied from the app; a faster run replaces it.
 */
function keepOfficial(record, previous) {
  const old = previous?.find((p) => p.badge === record.badge);
  if (!old) return record;
  const days = Math.abs(Date.parse(old.date) - Date.parse(record.date)) / 86400000;
  return days <= 1 ? { ...record, value: old.value } : record;
}

function stats(runs, activities, previous) {
  const byId = new Map(activities.map((a) => [a.id, a]));
  const records = RECORDS.map(({ km, badge, label }) => {
    let best = null;
    for (const run of runs) {
      const secs = bestEfforts(byId.get(run.id), [km])[km];
      if (secs && (!best || secs < best.secs)) best = { secs, date: run.date };
    }
    return best ? keepOfficial({ badge, label, value: clock(best.secs), date: best.date }, previous) : null;
  }).filter(Boolean);

  const totalKm = round(
    runs.reduce((s, r) => s + r.km, 0),
    2,
  );
  return { totalKm, records };
}

// ---------- helpers ----------

function round(n, places) {
  const f = 10 ** places;
  return Math.round(n * f) / f;
}
function clock(secs) {
  const s = Math.round(secs);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}
function escape(s) {
  return s.replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" })[c]);
}

// ---------- main ----------

if (process.env.NIKE_TEST) {
  globalThis.__nike = { bestEfforts, summarise, stats, gpx, clock };
} else {
  await main();
}

async function main() {
  const auth = await token();
  const list = await listActivities(auth);
  if (!list.length) throw new Error("Nike returned no runs. Check the token belongs to your account.");
  const activities = await details(
    list.map((a) => a.id),
    auth,
  );
  const runs = activities
    .filter((a) => a.start_epoch_ms)
    .map(summarise)
    .filter((r) => r.km > 0)
    .sort((a, b) => a.start - b.start);

  // Rewritten from scratch each time, so a run whose date changed isn't left behind twice
  rmSync(join(CACHE, "gpx"), { recursive: true, force: true });
  mkdirSync(join(CACHE, "gpx"), { recursive: true });
  let routes = 0;
  for (const a of activities) {
    const run = runs.find((r) => r.id === a.id);
    const doc = run && gpx(a, run);
    if (!doc) continue;
    writeFileSync(join(CACHE, "gpx", `${run.date}-${a.id}.gpx`), doc);
    routes++;
  }

  const before = JSON.parse(readFileSync(RUNNING, "utf8"));
  const after = {
    ...stats(runs, activities, before.records),
    asOf: new Date().toLocaleDateString("en-CA"),
    note: "Imported from Nike Run Club by scripts/nike/import.mjs. Rerun it to update.",
  };

  console.log(`\n${runs.length} runs, ${routes} with GPS. GPX files are in ${CACHE}/gpx/.\n`);
  console.log("                     before → after");
  console.log(`Total km             ${before.totalKm} → ${after.totalKm}`);
  for (const r of after.records) {
    const old = before.records.find((o) => o.badge === r.badge);
    console.log(`${r.label.padEnd(20)} ${old ? `${old.value} (${old.date})` : "–"} → ${r.value} (${r.date})`);
  }

  if (DRY) {
    console.log("\nDry run: nothing written to src/.");
  } else {
    writeFileSync(RUNNING, `${JSON.stringify(after, null, 2)}\n`);
    writeFileSync(
      RUNS,
      `${JSON.stringify(
        runs.map((r) => ({ ...r, start: undefined })),
        null,
        0,
      ).replace(/\},\{/g, "},\n{")}\n`,
    );
    const highlights = await buildHighlights();
  console.log(`\nWrote ${RUNNING}, ${RUNS} and ${highlights.length} route highlights.`);
  }
}
