"use client";

import { useState } from "react";
import highlights from "@/data/run-highlights.json";

// Pace within each run, in the Purple level's colour: dim (slower) to bright (faster)
const PACE = [
  { label: "Slower", color: "#6a5fd6" },
  { label: "Steady", color: "#9d93f7" },
  { label: "Faster", color: "#dcd8ff" },
];
const FIRST = 6;

// The maps are always dark and nearly monochrome, so the route carries the colour
const MAP_LAYERS = [
  { layer: "water", className: "bg-[#0f1013]" },
  { layer: "minor", className: "bg-[#212329]" },
  { layer: "major", className: "bg-[#2f3239]" },
] as const;

type Highlight = (typeof highlights)[number];

/**
 * A run from each city, as its route over a street map, coloured by pace
 * within that run. Routes lose their first and last stretch, so they don't
 * show where a run started or ended.
 */
export function RunRoutes() {
  const [all, setAll] = useState(false);
  const shown = all ? highlights : highlights.slice(0, FIRST);

  return (
    <section aria-label="Runs around the world" className="mt-12">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-3">
        <h3 className="font-mono text-[0.625rem] tracking-[0.1em] text-muted uppercase">
          Runs around the world · {highlights.length} cities
        </h3>
        <p aria-label="Route colour shows pace, from slower to faster" className="flex items-center gap-2 font-mono text-[0.55rem] tracking-[0.1em] text-muted uppercase">
          Slower
          <span className="flex overflow-hidden rounded-full">
            {PACE.map((p) => (
              <span key={p.label} className="h-1.5 w-5" style={{ backgroundColor: p.color }} />
            ))}
          </span>
          Faster
        </p>
      </div>

      <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {shown.map((run) => (
          <RouteCard key={run.id} run={run} />
        ))}
      </ul>

      <div className="mt-6 flex justify-center">
        {highlights.length > FIRST && (
          <button
            type="button"
            onClick={() => setAll((v) => !v)}
            className="rounded-[3px] border border-foreground px-6 py-2.5 font-mono text-[0.625rem] tracking-[0.1em] uppercase transition-colors hover:bg-foreground hover:text-background"
          >
            {all ? "Show fewer" : `Show all ${highlights.length} cities`}
          </button>
        )}
      </div>
    </section>
  );
}

function RouteCard({ run }: { run: Highlight }) {
  return (
    <li className="group relative aspect-square overflow-hidden rounded-[10px] bg-[#17181c]">
      {/* The street map: each layer is an SVG used as a mask and filled with
          the theme's colours, so it follows light and dark mode */}
      <div
        aria-hidden
        className="absolute inset-0 transition-transform duration-700 ease-[cubic-bezier(0.2,0.7,0.2,1)] group-hover:scale-[1.04] motion-reduce:transition-none"
      >
        {MAP_LAYERS.map(({ layer, className }) => (
          <div
            key={layer}
            className={`absolute inset-0 ${className}`}
            style={{
              maskImage: `url(${run.map[layer]})`,
              WebkitMaskImage: `url(${run.map[layer]})`,
              maskSize: "100% 100%",
              WebkitMaskSize: "100% 100%",
            }}
          />
        ))}
      </div>

      <svg
        viewBox="0 0 100 100"
        role="img"
        aria-label={`Route of a ${run.km.toFixed(1)} km run in ${run.city}`}
        className="absolute inset-0 h-full w-full transition-transform duration-700 ease-[cubic-bezier(0.2,0.7,0.2,1)] group-hover:scale-[1.04] motion-reduce:transition-none"
      >
        {/* A soft outline under the route, so it reads over any street */}
        <path
          d={run.paths.join("")}
          fill="none"
          stroke="#0d0f12"
          strokeOpacity={0.9}
          strokeWidth={6.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        {run.paths.map((d, i) =>
          d ? (
            <path
              key={i}
              d={d}
              fill="none"
              stroke={PACE[i].color}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          ) : null,
        )}
      </svg>

      {/* City and distance, over a gradient so they read on any map */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-[#0d0f12]/90 via-[#0d0f12]/45 to-transparent px-3 pt-12 pb-3 text-white sm:px-4 sm:pb-3.5">
        <div className="min-w-0">
          <p className="truncate text-[clamp(1rem,1.9vw,1.35rem)] leading-tight font-semibold tracking-[-0.01em]">
            {run.city}
          </p>
          <p className="truncate font-mono text-[0.55rem] tracking-[0.1em] text-white/75 uppercase">{run.country}</p>
        </div>
        <p className="shrink-0 font-mono text-[0.62rem] tracking-[0.08em] uppercase tabular-nums">
          <span className="text-[0.95rem] font-semibold tracking-normal">{run.km.toFixed(1)}</span> km
        </p>
      </div>
    </li>
  );
}
