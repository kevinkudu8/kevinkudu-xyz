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

export function getTravelStats() {
  const { flights, distanceKm, flightMinutes, airports } = data.stats;
  const days = Math.floor(flightMinutes / 1440);
  const hours = Math.floor((flightMinutes % 1440) / 60);
  return {
    asOf: data.asOf,
    flights,
    distanceKm,
    flightTime: `${days}d ${hours}h`,
    airports,
    comparisons: [
      { label: "Around the Earth", times: distanceKm / EARTH_KM },
      { label: "To the Moon", times: distanceKm / MOON_KM },
      { label: "Around the Sun", times: distanceKm / SUN_KM },
    ],
  };
}
