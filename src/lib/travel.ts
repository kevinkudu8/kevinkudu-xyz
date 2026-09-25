import { geoNaturalEarth1, geoPath } from "d3-geo";
import type { FeatureCollection, Geometry } from "geojson";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import world from "world-atlas/countries-110m.json";
import data from "@/data/travel.json";

const WIDTH = 1000;
// Centred on the Pacific so Seoul sits mid-map, with the seam at 11°W: east
// of Greenland and west of Ireland. No Atlantic meridian misses all land, so
// West Africa's bulge wraps to the far right; cropping there hides the strip
// (nothing from the Americas reaches that far).
const CENTRE_LON = 169;
const CROP_RIGHT = 972;
const ANTARCTICA = "010";

const EARTH_KM = 40_075;
const MOON_KM = 384_400;
const SUN_KM = 4_379_000; // circumference

// 193 UN members plus the two observer states (Vatican City, Palestine)
const WORLD_COUNTRIES = 195;
// Visited places that aren't sovereign countries, so not counted toward the share
const TERRITORIES = new Set(["HK"]);

const regionName = new Intl.DisplayNames("en", { type: "region" });
const countryName = (iso: string) => (iso === "HK" ? "Hong Kong" : regionName.of(iso) ?? iso);

export type TravelMapData = {
  width: number;
  height: number;
  countries: string[];
  places: { key: string; city: string; country: string; x: number; y: number }[];
};

export function getTravelMap(): TravelMapData {
  const topology = world as unknown as Topology<{ countries: GeometryCollection }>;
  const all = feature(topology, topology.objects.countries) as FeatureCollection<Geometry>;
  const land: FeatureCollection<Geometry> = {
    type: "FeatureCollection",
    features: all.features.filter((f) => f.id !== ANTARCTICA),
  };

  const projection = geoNaturalEarth1().rotate([-CENTRE_LON, 0]);
  projection.fitWidth(WIDTH, land);
  const path = geoPath(projection).digits(1);
  const [[, top], [, bottom]] = path.bounds(land);
  projection.translate([projection.translate()[0], projection.translate()[1] - top]);
  const height = Math.ceil(bottom - top);

  return {
    width: CROP_RIGHT,
    height,
    countries: land.features.map((f) => path(f) ?? "").filter(Boolean),
    places: data.places.map((p) => {
      const [x, y] = projection([p.lon, p.lat]) ?? [0, 0];
      return { key: `${p.city}-${p.iso}`, city: p.city, country: countryName(p.iso), x: x / CROP_RIGHT, y: y / height };
    }),
  };
}

export type TravelStats = ReturnType<typeof getTravelStats>;

export function getTravelStats() {
  const { flights, distanceKm, flightMinutes, airports, firstFlight, mostLandings } = data.stats;
  const visited = [...new Set(data.places.map((p) => p.iso))]
    .filter((iso) => !TERRITORIES.has(iso))
    .map(countryName)
    .sort();
  return {
    asOf: data.asOf,
    flights,
    distanceKm,
    flightMinutes,
    airports,
    since: new Date(`${firstFlight}T00:00:00`).toLocaleDateString("en-US", { month: "short", year: "numeric" }),
    kmPerFlight: Math.round(distanceKm / flights),
    hours: Math.round(flightMinutes / 60),
    mostLandings,
    countries: { visited, of: WORLD_COUNTRIES },
    earthLaps: distanceKm / EARTH_KM,
    moonShare: distanceKm / MOON_KM,
    sunShare: distanceKm / SUN_KM,
    reference: { earthKm: EARTH_KM, moonKm: MOON_KM, sunKm: SUN_KM },
  };
}
