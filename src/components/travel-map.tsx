import { getTravelMap } from "@/lib/travel";

/** World map with a pulsing dot on each city visited; hover or focus shows the country. */
export function TravelMap() {
  const { width, height, countries, places } = getTravelMap();

  return (
    <div className="relative mt-12">
      <svg viewBox={`0 0 ${width} ${height}`} className="block h-auto w-full" aria-hidden>
        {countries.map((d, i) => (
          <path key={i} d={d} fill="#e2e2e0" stroke="var(--background)" strokeWidth={0.6} />
        ))}
      </svg>

      <ul aria-label="Cities visited">
        {places.map((place, i) => (
          <li
            key={place.key}
            className="group absolute size-0 hover:z-10 focus-within:z-10"
            style={{ left: `${place.x * 100}%`, top: `${place.y * 100}%` }}
          >
            <button
              type="button"
              aria-label={`${place.city}, ${place.country}`}
              className="absolute top-0 left-0 grid size-4 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              <span
                aria-hidden
                className="absolute size-2 rounded-full bg-[#ff4f1f] motion-reduce:hidden"
                style={{ animation: `place-pulse 2.6s ease-out ${(i % 7) * 0.37}s infinite` }}
              />
              <span aria-hidden className="relative size-2 rounded-full bg-[#ff4f1f] ring-2 ring-background" />
            </button>
            <span
              aria-hidden
              className="pointer-events-none absolute bottom-3 left-0 -translate-x-1/2 bg-foreground px-2.5 py-1.5 font-mono text-[0.65rem] tracking-[0.08em] whitespace-nowrap text-background uppercase opacity-0 transition-opacity duration-150 group-focus-within:opacity-100 group-hover:opacity-100"
            >
              {place.country}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
