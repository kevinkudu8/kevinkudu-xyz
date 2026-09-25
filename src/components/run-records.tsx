import { getRunningStats } from "@/lib/running";

const ORANGE = "#ff4f1f";
const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

// Icons for the two records that aren't a distance
function Glyph({ kind }: { kind: string }) {
  if (kind === "far") {
    return (
      <g fill="none" stroke={ORANGE} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
        <path d="M60 30 80 50 60 70 40 50Z" />
        <path d="M60 60V40M53 47l7-7 7 7" />
      </g>
    );
  }
  if (kind === "long") {
    return (
      <g fill="none" stroke={ORANGE} strokeWidth="3" strokeLinecap="round">
        <circle cx="60" cy="53" r="16" />
        <path d="M60 53v-8M56 32h8M60 32v5" />
      </g>
    );
  }
  return null;
}

/** Personal records as shields that flip over (hover, focus or tap) to show the time. */
export function RunRecords() {
  const { records } = getRunningStats();
  return (
    <section aria-label="Personal records" className="mt-16">
      <h3 className="font-mono text-[0.625rem] tracking-[0.1em] text-muted uppercase">Personal records</h3>
      <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-4">
        {records.map((r) => {
          const icon = r.badge === "far" || r.badge === "long";
          return (
            <li key={r.label} className="flex flex-col items-center text-center">
              <button
                type="button"
                aria-label={`${r.label}: ${r.value}, ${formatDate(r.date)}`}
                className="group/flip relative h-[8.5rem] w-[7.5rem] [perspective:700px]"
              >
                <span className="absolute inset-0 transition-transform duration-700 ease-[cubic-bezier(0.2,0.7,0.2,1)] [transform-style:preserve-3d] group-hover/flip:[transform:rotateY(180deg)] group-focus-visible/flip:[transform:rotateY(180deg)] motion-reduce:transition-none">
                  {/* Front: the badge */}
                  <svg viewBox="0 0 120 136" className="absolute inset-0 h-full w-full [backface-visibility:hidden]" aria-hidden>
                    <path d="M8 6h104v96L60 130 8 102Z" fill="#161616" />
                    <path d="M16 14h88v83L60 120 16 97Z" fill="none" stroke={ORANGE} strokeWidth="2.5" />
                    {icon ? (
                      <Glyph kind={r.badge} />
                    ) : (
                      <text x="60" y="66" textAnchor="middle" fill={ORANGE} fontSize={r.badge.length > 3 ? 23 : 30} fontWeight="900" fontStyle="italic" letterSpacing="-1">
                        {r.badge}
                      </text>
                    )}
                    <path d="M44 92h32" stroke={ORANGE} strokeWidth="2.5" strokeLinecap="round" opacity=".6" />
                  </svg>
                  {/* Back: the time and date */}
                  <svg viewBox="0 0 120 136" className="absolute inset-0 h-full w-full [backface-visibility:hidden] [transform:rotateY(180deg)]" aria-hidden>
                    <path d="M8 6h104v96L60 130 8 102Z" fill={ORANGE} />
                    <text x="60" y="62" textAnchor="middle" fill="#161616" fontSize={r.value.length > 6 ? 17 : 22} fontWeight="700" letterSpacing="-.5">
                      {r.value}
                    </text>
                    <text x="60" y="84" textAnchor="middle" fill="#161616" fontSize="7.5" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" letterSpacing="1">
                      {formatDate(r.date).toUpperCase()}
                    </text>
                  </svg>
                </span>
              </button>
              <p className="mt-3 text-sm leading-snug">{r.label}</p>
              <p className="mt-0.5 font-mono text-[0.6rem] tracking-[0.08em] text-muted uppercase">{r.value}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
