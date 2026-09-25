import data from "@/data/running.json";

// Nike Run Club levels, by lifetime kilometres
const LEVELS = [
  { name: "Yellow", from: 0, bg: "#f5d90a", fg: "#0f0f0f" },
  { name: "Orange", from: 50, bg: "#ff7a1a", fg: "#0f0f0f" },
  { name: "Green", from: 250, bg: "#3dbe5c", fg: "#0f0f0f" },
  { name: "Blue", from: 1000, bg: "#2f6fed", fg: "#ffffff" },
  { name: "Purple", from: 2500, bg: "#6d4fe0", fg: "#ffffff" },
  { name: "Black", from: 5000, bg: "#1b1b1b", fg: "#ffffff" },
  { name: "Volt", from: 15000, bg: "#d4ff1f", fg: "#0f0f0f" },
] as const;

const KM_PER_MILE = 1.609344;

export function getRunning() {
  const km = data.totalKm;
  const index = LEVELS.findLastIndex((level) => km >= level.from);
  const level = LEVELS[index];
  const next = LEVELS[index + 1] ?? null;
  return {
    km,
    miles: km / KM_PER_MILE,
    asOf: data.asOf,
    level,
    next: next && {
      name: next.name,
      remainingKm: next.from - km,
      progress: (km - level.from) / (next.from - level.from),
    },
  };
}
