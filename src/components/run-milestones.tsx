import { getRunningStats } from "@/lib/running";

const ORANGE = "#ff4f1f";

/** Monthly-distance medals and streak counts. */
export function RunMilestones() {
  const { monthly, streaks, asOf } = getRunningStats();
  return (
    <div className="mt-16 grid gap-14 border-t border-foreground/15 pt-10 md:grid-cols-[1.35fr_1fr] md:gap-10">
      <section aria-label="Monthly distance">
        <h3 className="font-mono text-[0.625rem] tracking-[0.1em] text-muted uppercase">Months over…</h3>
        <ul className="mt-8 grid grid-cols-4 gap-3">
          {monthly.map((m) => (
            <li key={m.tier} className="group flex flex-col items-center text-center">
              <svg
                viewBox="0 0 80 92"
                className="w-full max-w-[5.5rem] transition-transform duration-500 ease-[cubic-bezier(0.2,0.7,0.2,1)] group-hover:-translate-y-1 group-hover:-rotate-6 motion-reduce:transition-none"
                aria-hidden
              >
                <path d="M6 6h68v42a34 34 0 0 1-68 0Z" fill={m.color} />
                <path d="M12 12h56v36a28 28 0 0 1-56 0Z" fill="none" stroke="#161616" strokeOpacity=".55" strokeWidth="2" />
                <text x="40" y="44" textAnchor="middle" fill="#161616" fontSize="19" fontWeight="900" letterSpacing="-.5">
                  {m.km}K
                </text>
                <text x="40" y="60" textAnchor="middle" fill="#161616" fillOpacity=".7" fontSize="7" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" letterSpacing="1.2">
                  MONTH
                </text>
              </svg>
              <p className="mt-3 text-[clamp(1.4rem,2.4vw,2rem)] leading-none tabular-nums">
                {m.times}
                <span className="text-[0.6em] text-muted">×</span>
              </p>
              <p className="mt-1.5 font-mono text-[0.55rem] tracking-[0.08em] text-muted uppercase">
                {m.tier} · {m.km} km
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Streaks">
        <h3 className="font-mono text-[0.625rem] tracking-[0.1em] text-muted uppercase">Streaks</h3>
        <ul className="mt-8 space-y-4">
          {streaks.map((s) => (
            <li key={`${s.length}-${s.unit}`} className="flex items-center gap-4">
              <svg viewBox="0 0 96 40" className="w-20 shrink-0" aria-hidden>
                <path d="M4 8h66l18 12-18 12H4l10-12Z" fill="#161616" />
                <text x="44" y="27" textAnchor="middle" fill={ORANGE} fontSize="17" fontWeight="900" fontStyle="italic">
                  {s.length}
                </text>
              </svg>
              <p className="text-[clamp(1.4rem,2.4vw,2rem)] leading-none tabular-nums">
                {s.times}
                <span className="text-[0.6em] text-muted">×</span>
              </p>
              <p className="font-mono text-[0.6rem] tracking-[0.08em] text-muted uppercase">
                {s.length}-{s.unit} streak
              </p>
            </li>
          ))}
        </ul>
      </section>

      <p className="font-mono text-[0.6rem] tracking-[0.08em] text-muted uppercase md:col-span-2">
        From Nike Run Club · updated{" "}
        {new Date(`${asOf}T00:00:00`).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
      </p>
    </div>
  );
}
