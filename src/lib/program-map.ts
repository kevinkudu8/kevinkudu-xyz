import { geoNaturalEarth1, geoPath } from "d3-geo";
import type { FeatureCollection, Geometry } from "geojson";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import world from "world-atlas/countries-110m.json";

// Timeline places, matched by name ("New York · Online" would be two).
// Online events get no pin and aren't on the map at all. `label` is which
// side of the pin its name sits on, chosen so neighbours don't collide.
type Side = "left" | "right" | "above" | "below";
const PLACES: Record<string, { lon: number; lat: number; label: Side }> = {
  Denver: { lon: -104.99, lat: 39.74, label: "above" },
  Austin: { lon: -97.74, lat: 30.27, label: "below" },
  "San Jose": { lon: -121.89, lat: 37.34, label: "left" },
  "Las Vegas": { lon: -115.14, lat: 36.17, label: "below" },
  Toronto: { lon: -79.38, lat: 43.65, label: "above" },
  "New York": { lon: -74.0, lat: 40.71, label: "below" },
  "New Delhi": { lon: 77.21, lat: 28.61, label: "above" },
  Singapore: { lon: 103.82, lat: 1.35, label: "below" },
  Bangkok: { lon: 100.5, lat: 13.76, label: "left" },
  "Hong Kong": { lon: 114.17, lat: 22.32, label: "right" },
};

const WIDTH = 1000;
const HEIGHT = 520;
// Centred on the Pacific, so North America and Asia sit either side of it, as on the travel map
const CENTRE_LON = 182;
const ANTARCTICA = "010";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export type ProgramMap = {
  width: number;
  height: number;
  land: string[];
  /** Every city the program went to, as a share of the map's width and height */
  cities: { name: string; x: number; y: number; label: Side }[];
  /** The in-person events in date order: which timeline item, its cities, and where it falls on the time axis (0–1) */
  stops: { item: number; cities: number[]; at: number }[];
  /** Year marks along the time axis */
  years: { label: string; at: number }[];
};

/** "Sep 18–20, 2024" or "Feb 2024" -> the first day it covers. */
function parseDate(date: string): number | null {
  const month = MONTHS.findIndex((m) => date.includes(m));
  const year = date.match(/\b(20\d\d)\b/)?.[1];
  if (month < 0 || !year) return null;
  const day = Number(date.match(/[A-Z][a-z]{2} (\d{1,2})\b/)?.[1] ?? 1);
  return Date.UTC(Number(year), month, day);
}

/** A map of a program's in-person events, from its timeline. */
export function programMap(items: { place: string; date: string }[]): ProgramMap {
  const cities: ProgramMap["cities"] = [];
  const index = new Map<string, number>();
  const events = items
    .map((item, i) => ({
      item: i,
      names: item.place
        .split("·")
        .map((s) => s.trim())
        .filter((n) => n in PLACES),
      time: parseDate(item.date),
    }))
    .filter((e): e is typeof e & { time: number } => e.names.length > 0 && e.time !== null)
    .sort((a, b) => a.time - b.time || a.item - b.item);
  const used = [...new Set(events.flatMap((e) => e.names))];

  const projection = geoNaturalEarth1().rotate([-CENTRE_LON, 0]);
  // Frame the cities with a margin for their labels
  projection.fitExtent(
    [
      [70, 60],
      [WIDTH - 70, HEIGHT - 60],
    ],
    { type: "MultiPoint", coordinates: used.map((n) => [PLACES[n].lon, PLACES[n].lat]) },
  );
  projection.clipExtent([
    [0, 0],
    [WIDTH, HEIGHT],
  ]);

  for (const name of used) {
    const { lon, lat, label } = PLACES[name];
    const [x, y] = projection([lon, lat]) ?? [0, 0];
    index.set(name, cities.length);
    cities.push({ name, x: x / WIDTH, y: y / HEIGHT, label });
  }

  // The time axis runs from the start of the first year to the end of the last
  const first = new Date(events[0]?.time ?? Date.now()).getUTCFullYear();
  const last = new Date(events.at(-1)?.time ?? Date.now()).getUTCFullYear();
  const from = Date.UTC(first, 0, 1);
  const span = Date.UTC(last + 1, 0, 1) - from;

  const topology = world as unknown as Topology<{ countries: GeometryCollection }>;
  const all = feature(topology, topology.objects.countries) as FeatureCollection<Geometry>;
  const path = geoPath(projection).digits(1);

  return {
    width: WIDTH,
    height: HEIGHT,
    // Only what falls inside the frame
    land: all.features
      .filter((f) => f.id !== ANTARCTICA)
      .map((f) => path(f) ?? "")
      .filter(Boolean),
    cities,
    stops: events.map((e) => ({ item: e.item, cities: e.names.map((n) => index.get(n)!), at: (e.time - from) / span })),
    years: Array.from({ length: last - first + 1 }, (_, i) => ({
      label: String(first + i),
      at: (Date.UTC(first + i, 0, 1) - from) / span,
    })),
  };
}
