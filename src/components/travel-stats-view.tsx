"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import type { TravelStats } from "@/lib/travel";

const ORANGE = "#ff4f1f";
const fmt = (n: number) => Math.round(n).toLocaleString("en-US");
const formatFlightTime = (minutes: number) =>
  `${Math.floor(minutes / 1440)}d ${Math.floor((minutes % 1440) / 60)}h`;

/** True once the element has been on screen (the panel starts hidden in its tab). */
function useSeen<T extends Element>() {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setSeen(true);
        io.disconnect();
      }
    }, { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, seen] as const;
}

const reducedMotion = () =>
  typeof window !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Counts from 0 to `to` once `run` flips on, writing straight to the text node
 * so React doesn't re-render every frame. Renders the final value on the
 * server and for reduced motion.
 */
function CountUp({ to, format, run }: { to: number; format: (n: number) => string; run: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    if (ref.current && !reducedMotion()) ref.current.textContent = format(0);
  }, [format]);

  useEffect(() => {
    const el = ref.current;
    if (!el || !run || reducedMotion()) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 1400);
      el.textContent = format(to * (1 - Math.pow(1 - t, 3)));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [run, to, format]);

  return <span ref={ref}>{format(to)}</span>;
}

export function TravelStatsView({ stats }: { stats: TravelStats }) {
  const [ref, seen] = useSeen<HTMLDivElement>();
  const numbers = [
    { label: "Flights", to: stats.flights, format: fmt, note: `Since ${stats.since}` },
    { label: "Distance", to: stats.distanceKm, format: fmt, unit: "km", note: `${fmt(stats.kmPerFlight)} km per flight` },
    { label: "Flight time", to: stats.flightMinutes, format: formatFlightTime, note: `${fmt(stats.hours)} hours in the air` },
    {
      label: "Airports",
      to: stats.airports,
      format: fmt,
      note: `${stats.mostLandings.city}: ${stats.mostLandings.count} landings`,
    },
  ];

  return (
    <div ref={ref} className="mt-14" data-seen={seen || undefined}>
      <dl className="grid grid-cols-2 gap-x-8 gap-y-10 border-t border-foreground pt-8 md:grid-cols-4">
        {numbers.map((s) => (
          <div key={s.label}>
            <dt className="font-mono text-[0.625rem] tracking-[0.1em] text-muted uppercase">{s.label}</dt>
            <dd className="mt-3 text-[clamp(1.6rem,2.6vw,2.4rem)] leading-none tracking-[0.02em] tabular-nums">
              <CountUp to={s.to} format={s.format} run={seen} />
              {s.unit && <span className="ml-1.5 text-[0.55em] text-muted">{s.unit}</span>}
            </dd>
            <dd className="mt-3 font-mono text-[0.6rem] tracking-[0.08em] text-muted uppercase">{s.note}</dd>
          </div>
        ))}
      </dl>

      <CountriesGrid visited={stats.countries.visited} of={stats.countries.of} seen={seen} />

      <div className="mt-16 grid gap-4 md:grid-cols-3">
        <Card figure={<EarthFigure />} value={`${stats.earthLaps.toFixed(1)}×`} caption="Around the Earth"
          note={`${fmt(stats.reference.earthKm)} km a lap`} />
        <Card figure={<MoonFigure share={stats.moonShare} seen={seen} />} value={`${Math.round(stats.moonShare * 100)}%`}
          caption="Of the way to the Moon" note={`${fmt(stats.reference.moonKm)} km away`} />
        <Card figure={<SunFigure share={stats.sunShare} seen={seen} />} value={`${(stats.sunShare * 100).toFixed(1)}%`}
          caption="Of a lap around the Sun" note={`${fmt(stats.reference.sunKm)} km around`} />
      </div>

      <p className="mt-12 font-mono text-[0.6rem] tracking-[0.08em] text-muted uppercase">
        All-time, from Flighty · updated{" "}
        {new Date(`${stats.asOf}T00:00:00`).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
      </p>
    </div>
  );
}

function CountriesGrid({ visited, of, seen }: { visited: string[]; of: number; seen: boolean }) {
  const share = (visited.length / of) * 100;
  return (
    <section className="mt-16 border-t border-foreground/15 pt-8" aria-label="Countries visited">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <p className="font-mono text-[0.625rem] tracking-[0.1em] text-muted uppercase">Countries visited</p>
        <p className="font-mono text-[0.625rem] tracking-[0.1em] text-muted uppercase">
          {visited.length} of {of}
        </p>
      </div>
      <p className="mt-3 text-[clamp(2.4rem,5vw,4rem)] leading-none tracking-[0.02em] tabular-nums">
        {share.toFixed(1)}
        <span className="ml-1 text-[0.5em] text-muted">%</span>
      </p>
      <ul className="mt-6 flex flex-wrap gap-[5px]" aria-label={`Visited: ${visited.join(", ")}`}>
        {Array.from({ length: of }, (_, i) => {
          const country = visited[i];
          return (
            <li
              key={i}
              title={country}
              aria-hidden
              className="size-[9px] rounded-full transition-[background-color,transform] duration-500 ease-out motion-reduce:transition-none"
              style={{
                backgroundColor: country && seen ? ORANGE : "color-mix(in srgb, var(--foreground) 11%, transparent)",
                transform: country && seen ? "scale(1.15)" : "scale(1)",
                transitionDelay: country ? `${300 + i * 70}ms` : undefined,
              }}
            />
          );
        })}
      </ul>
    </section>
  );
}

function Card({ figure, value, caption, note }: { figure: ReactNode; value: string; caption: string; note: string }) {
  return (
    <figure className="flex flex-col justify-between gap-6 rounded-[14px] border border-foreground/12 p-6">
      <div className="flex h-28 items-center justify-center">{figure}</div>
      <figcaption>
        <p className="text-[clamp(1.8rem,3vw,2.6rem)] leading-none tracking-[0.02em] tabular-nums">{value}</p>
        <p className="mt-2 text-sm">{caption}</p>
        <p className="mt-1 font-mono text-[0.6rem] tracking-[0.08em] text-muted uppercase">{note}</p>
      </figcaption>
    </figure>
  );
}

/** A small globe with a plane dot circling it. */
function EarthFigure() {
  return (
    <svg viewBox="0 0 120 120" className="h-full" aria-hidden>
      <circle cx="60" cy="60" r="44" fill="none" stroke="currentColor" strokeOpacity=".2" strokeDasharray="2 4" />
      <g fill="none" stroke="currentColor" strokeWidth="1.2">
        <circle cx="60" cy="60" r="24" />
        <ellipse cx="60" cy="60" rx="10" ry="24" />
        <path d="M36 60h48M39 48h42M39 72h42" strokeOpacity=".6" />
      </g>
      <g
        className="motion-reduce:[animation:none]"
        style={{ transformOrigin: "60px 60px", animation: "orbit 4.5s linear infinite" }}
      >
        <circle cx="104" cy="60" r="4" fill={ORANGE} />
        <circle cx="104" cy="60" r="8" fill={ORANGE} fillOpacity=".18" />
      </g>
    </svg>
  );
}

/** Earth on the left, the Moon on the right, and the distance flown drawn between them. */
function MoonFigure({ share, seen }: { share: number; seen: boolean }) {
  const from = 30;
  const to = 208;
  const reach = from + (to - from) * Math.min(share, 1);
  return (
    <svg viewBox="0 0 240 80" className="w-full" aria-hidden>
      <line x1={from} y1="40" x2={to} y2="40" stroke="currentColor" strokeOpacity=".2" strokeDasharray="2 4" />
      <line
        x1={from} y1="40" x2={reach} y2="40" stroke={ORANGE} strokeWidth="2" strokeLinecap="round"
        pathLength={1} strokeDasharray="1" strokeDashoffset={seen ? 0 : 1}
        className="transition-[stroke-dashoffset] delay-300 duration-[1600ms] ease-out motion-reduce:transition-none"
      />
      <circle cx="18" cy="40" r="12" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M8 36h20M8 44h20" stroke="currentColor" strokeOpacity=".6" />
      <circle cx="222" cy="40" r="9" fill="currentColor" fillOpacity=".14" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="219" cy="37" r="2" fill="currentColor" fillOpacity=".25" />
      <circle cx="225" cy="44" r="1.4" fill="currentColor" fillOpacity=".25" />
      <circle
        cx={reach} cy="40" r="4" fill={ORANGE}
        className="transition-opacity delay-[1800ms] duration-300 motion-reduce:transition-none"
        style={{ opacity: seen ? 1 : 0 }}
      />
    </svg>
  );
}

/** The Sun, with the share of one lap around it traced on its orbit. */
function SunFigure({ share, seen }: { share: number; seen: boolean }) {
  return (
    <svg viewBox="0 0 120 120" className="h-full" aria-hidden>
      <circle cx="60" cy="60" r="44" fill="none" stroke="currentColor" strokeOpacity=".2" strokeDasharray="2 4" />
      <circle cx="60" cy="60" r="24" fill={ORANGE} fillOpacity=".12" />
      <circle cx="60" cy="60" r="17" fill={ORANGE} />
      <circle
        cx="60" cy="60" r="44" fill="none" stroke={ORANGE} strokeWidth="2.5" strokeLinecap="round"
        pathLength={100} strokeDasharray={`${share * 100} 100`} strokeDashoffset={seen ? 0 : share * 100}
        transform="rotate(-90 60 60)"
        className="transition-[stroke-dashoffset] delay-300 duration-[1600ms] ease-out motion-reduce:transition-none"
      />
    </svg>
  );
}
