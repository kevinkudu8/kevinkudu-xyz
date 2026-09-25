import data from "@/data/running.json";

// Nike Run Club levels by lifetime kilometres. Each level is split into four
// equal stretches; the three boundaries inside it are milestones.
const LEVELS = [
  { name: "Yellow", from: 0, bg: "#f5d90a", fg: "#000000" },
  { name: "Orange", from: 50, bg: "#ff8a3d", fg: "#000000" },
  { name: "Green", from: 250, bg: "#5ed17a", fg: "#000000" },
  { name: "Blue", from: 1000, bg: "#4f8dff", fg: "#000000" },
  { name: "Purple", from: 2500, bg: "#a79dfe", fg: "#000000" },
  { name: "Black", from: 5000, bg: "#1b1b1b", fg: "#ffffff" },
  { name: "Volt", from: 15000, bg: "#d4ff1f", fg: "#000000" },
] as const;

const KM_PER_MILE = 1.609344;
const ORDINALS = ["1st", "2nd", "3rd"];

export function getRunning() {
  const km = data.totalKm;
  const index = LEVELS.findLastIndex((level) => km >= level.from);
  const level = LEVELS[index];
  const next = LEVELS[index + 1] ?? null;

  let goal: { label: string; remainingKm: number } | null = null;
  let progress = 1;
  if (next) {
    const span = next.from - level.from;
    progress = (km - level.from) / span;
    const milestone = [1, 2, 3].find((n) => level.from + (span * n) / 4 > km);
    goal = milestone
      ? { label: `${ORDINALS[milestone - 1]} milestone`, remainingKm: level.from + (span * milestone) / 4 - km }
      : { label: `${next.name} Level`, remainingKm: next.from - km };
  }

  return { km, miles: km / KM_PER_MILE, asOf: data.asOf, level, progress, goal };
}

export function getRunningStats() {
  return { records: data.records, monthly: data.monthly, streaks: data.streaks, asOf: data.asOf };
}
