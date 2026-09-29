import { RunBadge } from "@/components/run-badge";
import { getRunning, getRunTotals } from "@/lib/running";

/**
 * The level card with the headline numbers beside it, as one unit: same
 * height, corners and shadow. The card keeps its colour; the numbers sit on a
 * quiet panel.
 */
export function RunOverview() {
  const totals = getRunTotals();
  const { miles, asOf, level } = getRunning();
  const updated = new Date(`${asOf}T00:00:00`).toLocaleDateString("en-US", { month: "short", year: "numeric" });
  const tiles = [
    { label: "Runs", value: totals.runs.toLocaleString("en-US") },
    { label: "Hours on foot", value: totals.hours.toLocaleString("en-US") },
    { label: "Countries", value: String(totals.countries) },
  ];
  return (
    <div className="mt-12">
      <div className="grid gap-3 md:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] md:gap-4">
        <RunBadge />
        <dl
          className="grid grid-cols-3 overflow-hidden rounded-[14px] shadow-[0_24px_48px_-28px_rgb(0_0_0/0.45)] md:grid-cols-1 md:grid-rows-3"
          // A pale wash of the level colour: part of the same set as the card, quieter than it
          style={{ backgroundColor: `color-mix(in srgb, ${level.bg} 16%, var(--background))` }}
        >
          {tiles.map((t, i) => (
            <div
              key={t.label}
              className={`flex flex-col justify-between gap-3 p-4 sm:p-5 md:flex-row md:items-center md:px-[7%] md:py-0 ${
                i ? "border-l border-foreground/[0.08] md:border-t md:border-l-0" : ""
              }`}
            >
              <dt className="font-mono text-[0.6rem] tracking-[0.12em] text-muted uppercase">{t.label}</dt>
              <dd className="text-[clamp(1.8rem,3.2vw,2.6rem)] leading-none font-black tracking-[-0.02em] italic">
                {t.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
      <p className="mt-5 font-mono text-[0.6rem] leading-relaxed tracking-[0.08em] text-muted uppercase">
        {Math.floor(miles).toLocaleString("en-US")} miles · logged on Nike Run Club · updated {updated}
      </p>
    </div>
  );
}
