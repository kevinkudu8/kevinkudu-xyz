"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { TimelineItem } from "@/lib/events";
import type { ProgramMap as MapData } from "@/lib/program-map";

const STEP_MS = 1300;

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * A program's in-person events played in date order on a dark map: an arc
 * flies to each new city, its pin lights, the date strip below moves along
 * and the caption names the event. Once it has played, hovering a timeline
 * row, a pin or a date brings that event back up.
 */
export function ProgramMap({
  map,
  items,
  active,
}: {
  map: MapData;
  items: TimelineItem[];
  /** The timeline row being hovered, if any */
  active: number | null;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const [started, setStarted] = useState(false);
  const [pinned, setPinned] = useState<number | null>(null);
  const dots = useId();
  const { stops, cities } = map;
  const n = stops.length;
  const playing = started && step < n;

  // Arcs in visiting order, each tagged with the stop that makes the trip
  const at = (c: number) => ({ x: cities[c].x * map.width, y: cities[c].y * map.height });
  const arcs: { stop: number; d: string }[] = [];
  let prev: number | null = null;
  stops.forEach((stop, s) => {
    for (const c of stop.cities) {
      if (prev !== null && prev !== c) {
        const a = at(prev);
        const b = at(c);
        const lift = Math.hypot(b.x - a.x, b.y - a.y) * 0.3;
        arcs.push({ stop: s, d: `M${a.x} ${a.y} Q${(a.x + b.x) / 2} ${(a.y + b.y) / 2 - lift} ${b.x} ${b.y}` });
      }
      prev = c;
    }
  });

  function play() {
    setPinned(null);
    setStep(0);
    setStarted(true);
  }

  // Plays once when it scrolls into view; reduced motion shows the finished map
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        if (matchMedia("(prefers-reduced-motion: reduce)").matches) setStep(n);
        else play();
      },
      { threshold: 0.45 },
    );
    io.observe(box);
    return () => io.disconnect();
  }, [n]);

  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => setStep((s) => s + 1), step === 0 ? 300 : STEP_MS);
    return () => clearTimeout(t);
  }, [playing, step]);

  // A hovered row only counts if it's on the map (online events aren't)
  const hovered = active === null ? -1 : stops.findIndex((s) => s.item === active);
  const current = hovered >= 0 ? hovered : (pinned ?? (playing && step > 0 ? step - 1 : null));
  const revealed = (s: number) => s < step;
  const hot = (s: number) => current === s;
  const item = current !== null ? items[stops[current].item] : null;
  const years = map.years.map((y) => y.label);
  // Two events on the same dates share a spot on the strip; the later one sits above
  const lane = stops.map((s, k) => stops.slice(0, k).filter((o) => o.at === s.at).length);
  const hover = (s: number | null) => {
    if (!playing) setPinned(s);
  };

  return (
    <div ref={boxRef} className="mt-5 overflow-hidden rounded-[14px] bg-[#060817] text-white">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 px-4 pt-5 sm:px-6 sm:pt-6">
        <dl className="flex gap-8 sm:gap-12">
          {[
            [n, "Events"],
            [cities.length, "Cities"],
          ].map(([value, label]) => (
            <div key={label} className="flex flex-col-reverse">
              <dt className="mt-2 font-mono text-[0.58rem] tracking-[0.12em] text-white/55 uppercase">{label}</dt>
              <dd className="text-[clamp(2.2rem,4.6vw,3.6rem)] leading-none font-light tracking-[-0.02em] tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="pb-0.5 font-mono text-[0.58rem] tracking-[0.12em] text-white/55 uppercase">
          Hosted and sponsored · {years[0]}–{years.at(-1)}
        </p>
      </div>

      <div className="relative aspect-[1000/520] bg-[radial-gradient(ellipse_at_50%_45%,#12215f_0%,#060817_70%)]">
        <svg viewBox={`0 0 ${map.width} ${map.height}`} className="absolute inset-0 h-full w-full" aria-hidden>
          <defs>
            <pattern id={dots} width="7" height="7" patternUnits="userSpaceOnUse">
              <circle cx="3.5" cy="3.5" r="1.25" fill="#3a4cb4" />
            </pattern>
          </defs>
          {map.land.map((d, i) => (
            <path key={i} d={d} fill={`url(#${dots})`} />
          ))}
          {arcs.map((arc, i) => (
            <path
              key={i}
              d={arc.d}
              pathLength={1}
              fill="none"
              stroke={hot(arc.stop) ? "#ffffff" : "#7fa6ff"}
              strokeWidth={hot(arc.stop) ? 2.4 : 1.4}
              strokeLinecap="round"
              strokeDasharray="1"
              strokeDashoffset={revealed(arc.stop) ? 0 : 1}
              opacity={revealed(arc.stop) ? (hot(arc.stop) ? 1 : 0.45) : 0}
              style={{ transition: "stroke-dashoffset 1s cubic-bezier(.4,0,.2,1), opacity .4s, stroke .3s" }}
            />
          ))}
          {/* A spark riding the newest arc */}
          {playing &&
            arcs
              .filter((arc) => arc.stop === step - 1)
              .map((arc) => (
                <circle key={`${step}-${arc.d}`} r="4.5" fill="#fff">
                  <animateMotion dur="1s" fill="freeze" path={arc.d} keySplines=".4 0 .2 1" calcMode="spline" keyTimes="0;1" />
                </circle>
              ))}
        </svg>

        <ul aria-label="Cities">
          {cities.map((city, c) => {
            const visits = stops.flatMap((s, k) => (s.cities.includes(c) ? [k] : []));
            const lit = visits.some(revealed);
            const isHot = current !== null && stops[current].cities.includes(c);
            const label = {
              left: "right-3 top-1/2 -translate-y-1/2",
              right: "left-3 top-1/2 -translate-y-1/2",
              above: "bottom-3 left-1/2 -translate-x-1/2",
              below: "top-3 left-1/2 -translate-x-1/2",
            }[city.label];
            return (
              <li
                key={city.name}
                className="absolute size-0"
                style={{ left: `${city.x * 100}%`, top: `${city.y * 100}%` }}
                onMouseEnter={() => hover(visits[visits.length - 1])}
                onMouseLeave={() => hover(null)}
              >
                <span
                  className={`absolute top-0 left-0 grid size-5 -translate-x-1/2 -translate-y-1/2 place-items-center transition-opacity duration-500 ${
                    lit ? "opacity-100" : "opacity-0"
                  }`}
                >
                  {isHot && (
                    <span
                      aria-hidden
                      className="absolute size-2.5 rounded-full bg-[#4d8dff] motion-reduce:hidden"
                      style={{ animation: "place-pulse 1.6s ease-out infinite" }}
                    />
                  )}
                  <span
                    className={`relative rounded-full transition-all duration-300 ${
                      isHot ? "size-2.5 bg-white shadow-[0_0_12px_3px_rgba(90,150,255,0.9)]" : "size-1.5 bg-[#9dbaff]"
                    }`}
                  />
                </span>
                <span
                  className={`pointer-events-none absolute font-mono text-[0.55rem] tracking-[0.1em] whitespace-nowrap uppercase transition-opacity duration-300 sm:text-[0.6rem] ${label} ${
                    isHot ? "opacity-100" : lit ? "opacity-0 sm:opacity-45" : "opacity-0"
                  }`}
                >
                  {city.name}
                  {visits.length > 1 && <span className="text-white/50"> ×{visits.length}</span>}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* The date strip: every event in order, filling in as it plays */}
      <div className="relative mx-5 h-12 sm:mx-7">
        <span className="absolute inset-x-0 top-5 h-px bg-white/15" />
        <span
          className="absolute top-5 left-0 h-px bg-white/70 transition-[width] duration-1000 ease-out"
          style={{ width: `${current !== null ? stops[current].at * 100 : step >= n ? 100 : 0}%` }}
        />
        {map.years.map((y) => (
          <span
            key={y.label}
            className="absolute top-7 -translate-x-px border-l border-white/25 pt-1 pl-1.5 font-mono text-[0.55rem] tracking-[0.1em] text-white/45"
            style={{ left: `${y.at * 100}%` }}
          >
            {y.label}
          </span>
        ))}
        {stops.map((stop, k) => (
          <button
            key={stop.item}
            type="button"
            aria-label={`${items[stop.item].title}, ${items[stop.item].date}`}
            onMouseEnter={() => hover(k)}
            onMouseLeave={() => hover(null)}
            onFocus={() => hover(k)}
            onBlur={() => hover(null)}
            className="absolute top-5 grid size-4 -translate-x-1/2 -translate-y-1/2 place-items-center"
            style={{ left: `${stop.at * 100}%`, marginTop: `${-lane[k] * 9}px` }}
          >
            <span
              className={`rounded-full transition-all duration-300 ${
                hot(k) ? "size-2.5 bg-white" : revealed(k) ? "size-1.5 bg-[#9dbaff]" : "size-1.5 bg-white/20"
              }`}
            />
          </button>
        ))}
      </div>

      <div className="flex min-h-[4.75rem] items-center justify-between gap-4 border-t border-white/10 px-4 py-3 sm:px-6">
        <div aria-live="polite" className="min-w-0">
          {item && current !== null ? (
            <>
              <p className="font-mono text-[0.58rem] tracking-[0.1em] text-white/55 uppercase">
                {pad(current + 1)} / {pad(n)} · {item.date} · {item.place}
              </p>
              <p className="mt-1 truncate text-[0.95rem]">
                {item.title} <span className="text-white/50">· {item.format}</span>
              </p>
            </>
          ) : (
            <p className="font-mono text-[0.6rem] tracking-[0.1em] text-white/55 uppercase">
              {step >= n ? (
                <>
                  <span className="sm:hidden">Tap a city or a date</span>
                  <span className="hidden sm:inline">Hover a city, a date or a row below</span>
                </>
              ) : (
                "In person, in order"
              )}
            </p>
          )}
        </div>
        {step >= n && !playing && (
          <button
            type="button"
            onClick={play}
            className="shrink-0 rounded-full border border-white/30 px-3.5 py-1.5 font-mono text-[0.58rem] tracking-[0.1em] uppercase transition-colors hover:bg-white/10"
          >
            Replay
          </button>
        )}
      </div>
    </div>
  );
}
