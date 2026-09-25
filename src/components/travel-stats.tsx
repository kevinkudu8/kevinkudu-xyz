import { getTravelStats } from "@/lib/travel";

const fmt = (n: number) => n.toLocaleString("en-US");
// Flighty style: one decimal from 0.1 up, two below
const times = (n: number) => `${n.toFixed(n >= 0.1 ? 1 : 2)}×`;

export function TravelStats() {
  const { flights, distanceKm, flightTime, airports, comparisons, asOf } = getTravelStats();
  const stats = [
    { label: "Flights", value: fmt(flights) },
    { label: "Distance", value: fmt(distanceKm), unit: "km" },
    { label: "Flight time", value: flightTime },
    { label: "Airports", value: fmt(airports) },
  ];

  return (
    <div className="mt-14">
      <dl className="grid grid-cols-2 gap-x-8 gap-y-10 border-t border-foreground pt-8 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label}>
            <dt className="font-mono text-[0.625rem] tracking-[0.1em] text-muted uppercase">{s.label}</dt>
            <dd className="mt-3 text-[clamp(1.6rem,2.6vw,2.4rem)] leading-none tracking-[0.02em] tabular-nums">
              {s.value}
              {s.unit && <span className="ml-1.5 text-[0.55em] text-muted">{s.unit}</span>}
            </dd>
          </div>
        ))}
      </dl>

      <ul className="mt-14 space-y-5">
        {comparisons.map((c) => (
          <li key={c.label} className="grid grid-cols-[7rem_1fr_3.5rem] items-center gap-4 sm:grid-cols-[9rem_1fr_4rem]">
            <span className="font-mono text-[0.625rem] tracking-[0.1em] uppercase">{c.label}</span>
            <span className="relative h-[3px] bg-foreground/12">
              <span
                className="absolute inset-y-0 left-0 bg-foreground"
                style={{ width: `${Math.min(c.times, 1) * 100}%` }}
              />
            </span>
            <span className="text-right font-mono text-xs tabular-nums">{times(c.times)}</span>
          </li>
        ))}
      </ul>

      <p className="mt-12 font-mono text-[0.6rem] tracking-[0.08em] text-muted uppercase">
        All-time, from Flighty · updated{" "}
        {new Date(`${asOf}T00:00:00`).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
      </p>
    </div>
  );
}
