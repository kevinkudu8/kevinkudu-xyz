import { getRunning } from "@/lib/running";

// NRC truncates totals rather than rounding (4,289.95 shows as 4,289)
const fmt = (n: number, digits = 0) =>
  n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });

/** Lifetime distance card, coloured by Nike Run Club level. */
export function RunBadge() {
  const { km, miles, asOf, level, progress, goal } = getRunning();
  const updated = new Date(`${asOf}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

  return (
    <div className="mt-12 max-w-[26rem]">
      <div
        className="flex aspect-[1.63] flex-col justify-between rounded-[14px] p-[7%] shadow-[0_24px_48px_-28px_rgb(0_0_0/0.45)]"
        style={{ backgroundColor: level.bg, color: level.fg }}
      >
        <div className="flex items-start justify-between">
          <p className="text-lg font-medium">{level.name}</p>
          <p className="font-mono text-[0.6rem] tracking-[0.12em] uppercase opacity-60">Run level</p>
        </div>

        <div>
          <p className="text-[clamp(3rem,9vw,4.75rem)] leading-none font-black tracking-[-0.02em] italic tabular-nums">
            {fmt(Math.floor(km))}
          </p>
          <p className="mt-2 text-base">Total Kilometres</p>
        </div>

        <div>
          <div
            className="relative h-[5px] rounded-full"
            style={{ backgroundColor: `color-mix(in srgb, ${level.fg} 21%, ${level.bg})` }}
            role="progressbar"
            aria-label={`Progress through ${level.name} level`}
            aria-valuenow={Math.round(progress * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{ width: `${progress * 100}%`, backgroundColor: level.fg }}
            />
            {[0.25, 0.5, 0.75].map((tick) => (
              <span
                key={tick}
                className="absolute top-1/2 size-[5px] -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{
                  left: `${tick * 100}%`,
                  backgroundColor: tick <= progress ? "#7e7e7e" : `color-mix(in srgb, #ffffff 45%, ${level.bg})`,
                }}
              />
            ))}
          </div>
          <p className="mt-4 text-base">
            {goal ? `${fmt(goal.remainingKm, 2)} km to ${goal.label}` : "Top level reached"}
          </p>
        </div>
      </div>

      <p className="mt-5 font-mono text-[0.6rem] leading-relaxed tracking-[0.08em] text-muted uppercase">
        {fmt(Math.floor(miles))} miles · logged on Nike Run Club · updated {updated}
      </p>
    </div>
  );
}
