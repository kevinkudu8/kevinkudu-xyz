import { getRunningStats } from "@/lib/running";

const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", { month: "short", year: "numeric" });

/** Personal records as a scoreboard: the distance, the time, and when. */
export function RunRecords() {
  const { records } = getRunningStats();
  return (
    <section aria-labelledby="run-records" className="mt-16">
      <h3 id="run-records" className="font-mono text-[0.625rem] tracking-[0.1em] text-muted uppercase">
        Personal records
      </h3>
      <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-[10px] border border-foreground/10 bg-foreground/10 sm:grid-cols-3">
        {records.map((r) => (
          <div key={r.label} className="group flex flex-col gap-5 bg-background p-5 sm:p-6">
            <dt className="flex items-baseline justify-between gap-3">
              <span className="text-[1.35rem] leading-none font-black tracking-[-0.02em] italic">
                {r.badge}
              </span>
              <span className="font-mono text-[0.55rem] tracking-[0.08em] text-muted uppercase">
                {formatDate(r.date)}
              </span>
            </dt>
            <dd>
              <span className="block text-[clamp(1.7rem,3vw,2.4rem)] leading-none tracking-[-0.02em]">{r.value}</span>
              <span className="mt-2 block text-sm text-muted">{r.label}</span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
