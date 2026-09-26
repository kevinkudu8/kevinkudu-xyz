"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent } from "react";
import type { EventEntry, Spotlight, TimelineItem } from "@/lib/events";

const subscribe = (onChange: () => void) => {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
};

export function EventsBrowser({ events, intro }: { events: EventEntry[]; intro: string }) {
  // The selected event lives in the URL hash, so links and back/forward work
  const hash = useSyncExternalStore(subscribe, () => window.location.hash.slice(1), () => "");
  const fallback = events.find((e) => e.featured) ?? events[0];
  const selected = events.find((e) => e.slug === hash) ?? fallback;
  const detailRef = useRef<HTMLDivElement>(null);

  function choose(slug: string) {
    // pushState doesn't fire hashchange, so announce it for the subscription above
    history.pushState(null, "", `#${slug}`);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    // On narrow screens the detail sits below the list; bring it into view
    if (matchMedia("(max-width: 767px)").matches) {
      requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  }

  return (
    <div className="grid gap-14 md:grid-cols-[minmax(13rem,18rem)_1fr] md:gap-[clamp(3rem,7vw,7.5rem)]">
      <aside className="self-start md:sticky md:top-10">
        <h1 className="font-mono text-[0.75rem] font-bold tracking-[0.1em] uppercase">Events and Experiential</h1>
        <p className="mt-4 max-w-[17rem] text-sm leading-relaxed text-muted">{intro}</p>

        <nav aria-label="Events" className="mt-10 md:mt-14">
          <ol className="border-t border-foreground/15">
            {events.map((event, i) => {
              const active = event.slug === selected.slug;
              const year = event.details.find((d) => d.label === "Year")?.value;
              return (
                <li key={event.slug} className="border-b border-foreground/15">
                  <button
                    type="button"
                    onClick={() => choose(event.slug)}
                    aria-current={active ? "true" : undefined}
                    className={`grid w-full grid-cols-[2rem_1fr_auto] items-baseline gap-2 py-3 text-left font-mono text-[0.72rem] tracking-[0.08em] uppercase transition-colors ${
                      active ? "text-foreground" : "text-muted hover:text-foreground"
                    }`}
                  >
                    <span aria-hidden>{active ? "→" : String(i + 1).padStart(2, "0")}</span>
                    <span className={active ? "font-bold" : undefined}>{event.title}</span>
                    <span className="text-muted">{year}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
      </aside>

      <div ref={detailRef} className="min-w-0 scroll-mt-6">
        <EventDetail key={selected.slug} event={selected} />
      </div>
    </div>
  );
}

/** Silent loop at the top of an event. Only plays on larger screens and when motion is welcome. */
function HeroLoop({ src, poster }: { src: string; poster: string | null }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (!matchMedia("(min-width: 768px) and (prefers-reduced-motion: no-preference)").matches) return;
    video.src = src;
    video.play().catch(() => {});
  }, [src]);
  return (
    <video
      ref={ref}
      poster={poster ?? undefined}
      muted
      loop
      playsInline
      preload="none"
      aria-hidden
      className="absolute inset-0 h-full w-full object-cover"
    />
  );
}

const ORANGE = "#ff4f1f";

/** Every activation in a program, one row each; rows with a photo show it on hover. */
function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <section aria-label="Timeline" className="mt-14">
      <h3 className="font-mono text-[0.6rem] tracking-[0.1em] text-muted uppercase">
        Timeline · {items.length} activations
      </h3>
      <ol className="mt-5 border-t border-foreground/15">
        {items.map((item, i) => (
          <li
            key={`${item.date}-${item.title}`}
            className="group relative grid grid-cols-[2rem_1fr] gap-x-3 border-b border-foreground/15 py-4 sm:grid-cols-[2rem_7.5rem_1fr_auto] sm:gap-x-5"
          >
            <span className="font-mono text-[0.6rem] tracking-[0.08em] text-muted">{String(i + 1).padStart(2, "0")}</span>
            <span className="hidden font-mono text-[0.62rem] tracking-[0.06em] uppercase sm:block">{item.date}</span>
            <div className="min-w-0">
              <p className="flex flex-wrap items-baseline gap-x-2 text-[0.95rem] leading-snug">
                {item.title}
                {item.image && (
                  <span aria-hidden className="size-1.5 translate-y-[-0.1em] self-center rounded-full" style={{ backgroundColor: ORANGE }} />
                )}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-muted">{item.detail}</p>
              <p className="mt-1.5 font-mono text-[0.58rem] tracking-[0.08em] text-muted uppercase sm:hidden">
                {item.date} · {item.format} · {item.place}
              </p>
            </div>
            <div className="hidden text-right font-mono text-[0.58rem] leading-relaxed tracking-[0.08em] text-muted uppercase sm:block">
              <p>{item.format}</p>
              <p>{item.place}</p>
            </div>
            {item.image && (
              <span className="pointer-events-none absolute top-1/2 right-[calc(100%+1.5rem)] z-10 hidden w-56 -translate-y-1/2 scale-95 overflow-hidden rounded-[6px] opacity-0 shadow-[0_18px_40px_-18px_rgb(0_0_0/0.5)] transition-[opacity,scale] duration-300 group-hover:scale-100 group-hover:opacity-100 xl:block">
                <Image src={item.image.src} alt="" width={item.image.width} height={item.image.height} sizes="14rem" className="h-auto w-full" />
              </span>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}

/** One piece of work told as numbered steps, with supporting images. */
function SpotlightSection({ spotlight }: { spotlight: Spotlight }) {
  return (
    <section aria-label={spotlight.title} className="mt-16 rounded-[14px] border border-foreground/12 p-6 sm:p-8">
      <p className="font-mono text-[0.6rem] tracking-[0.1em] text-muted uppercase">{spotlight.label}</p>
      <h3 className="mt-3 text-[clamp(1.5rem,2.4vw,2.1rem)] leading-tight tracking-[-0.01em]">{spotlight.title}</h3>
      <p className="mt-4 max-w-[60ch] text-[0.95rem] leading-[1.7]">{spotlight.text}</p>

      <ol className="mt-8 grid gap-4 sm:grid-cols-3 sm:gap-0">
        {spotlight.steps.map((step, i) => (
          <li key={step.title} className="relative sm:pr-10">
            <span
              className="grid size-9 place-items-center rounded-full font-mono text-[0.7rem] text-white"
              style={{ backgroundColor: ORANGE }}
            >
              {i + 1}
            </span>
            {i < spotlight.steps.length - 1 && (
              <span aria-hidden className="absolute top-[1.125rem] right-4 left-12 hidden h-px bg-foreground/25 sm:block">
                <span className="absolute -top-[0.3rem] -right-1 text-[0.6rem] leading-none" style={{ color: ORANGE }}>
                  ▶
                </span>
              </span>
            )}
            <p className="mt-3 text-base">{step.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted">{step.text}</p>
          </li>
        ))}
      </ol>

      {spotlight.images.length > 0 && (
        <div className="mt-8 grid grid-cols-2 items-start gap-3">
          {spotlight.images.map((img) => (
            <Image
              key={img.src}
              src={img.src}
              alt=""
              width={img.width}
              height={img.height}
              sizes="(max-width: 640px) 50vw, 30vw"
              className="h-auto w-full rounded-[4px]"
            />
          ))}
        </div>
      )}
    </section>
  );
}

function EventDetail({ event }: { event: EventEntry }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [viewing, setViewing] = useState<number | "film">(0);
  // With a loop up top, every photo goes in the gallery; otherwise the first photo is the hero
  const heroImage = event.loop ? null : event.images[0];
  // Photos already shown in the spotlight aren't repeated in the gallery
  const inSpotlight = new Set(event.spotlight?.images.map((img) => img.src));
  const gallery = (event.loop ? event.images : event.images.slice(1)).filter((img) => !inSpotlight.has(img.src));

  function open(target: number | "film") {
    setViewing(target);
    dialogRef.current?.showModal();
  }

  function step(by: number) {
    setViewing((i) => (typeof i === "number" ? (i + by + event.images.length) % event.images.length : i));
  }

  function onKey(e: KeyboardEvent<HTMLDialogElement>) {
    if (e.key === "ArrowRight") step(1);
    if (e.key === "ArrowLeft") step(-1);
  }

  const shown = typeof viewing === "number" ? event.images[viewing] : null;

  return (
    <article className="animate-[fade-in_0.35s_ease-out] motion-reduce:animate-none">
      {event.sample && (
        <p className="mb-5 inline-block rounded-full border border-foreground/25 px-3 py-1 font-mono text-[0.58rem] tracking-[0.12em] text-muted uppercase">
          Sample content
        </p>
      )}

      <h2 className="text-[clamp(1.9rem,3.2vw,3rem)] leading-[1.05] tracking-[-0.015em]">{event.title}</h2>

      {event.details.length > 0 && (
        <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-2 font-mono text-[0.65rem] tracking-[0.08em] uppercase">
          {event.details.map((d) => (
            <div key={d.label} className="flex gap-2">
              <dt className="text-muted">{d.label}</dt>
              <dd>{d.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {event.scope.length > 0 && (
        <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[0.65rem] tracking-[0.08em] uppercase">
          <span className="mr-1 text-muted">Scope</span>
          {event.scope.map((stage, i) => (
            <span key={stage} className="flex items-center gap-2">
              {i > 0 && (
                <span aria-hidden className="text-[#ff4f1f]">
                  →
                </span>
              )}
              {stage}
            </span>
          ))}
        </p>
      )}

      <div className="relative mt-8 aspect-[16/9] overflow-hidden bg-highlight">
        {event.loop ? (
          <HeroLoop src={event.loop} poster={event.poster} />
        ) : heroImage ? (
          <button type="button" onClick={() => open(0)} aria-label="View image full screen" className="group absolute inset-0">
            <Image
              src={heroImage.src}
              alt={`${event.title}, image 1 of ${event.images.length}`}
              fill
              loading="eager"
              fetchPriority="high"
              sizes="(max-width: 768px) 100vw, 62vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.015] motion-reduce:transition-none"
            />
          </button>
        ) : (
          <div className="grid h-full place-items-center font-mono text-xs tracking-[0.1em] text-muted uppercase">
            Images coming soon
          </div>
        )}
        {event.film && (
          <button
            type="button"
            onClick={() => open("film")}
            className="absolute bottom-4 left-4 flex items-center gap-2.5 rounded-full bg-background/90 py-2 pr-4 pl-3 font-mono text-[0.62rem] tracking-[0.1em] uppercase backdrop-blur transition-colors hover:bg-background"
          >
            <span aria-hidden className="grid size-5 place-items-center rounded-full bg-[#ff4f1f] text-[0.55rem] text-white">
              ▶
            </span>
            Watch the film
          </button>
        )}
      </div>

      {event.stats.length > 0 && (
        <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-foreground pt-7 sm:grid-cols-4">
          {event.stats.map((s) => (
            <div key={s.label}>
              <dd className="text-[clamp(1.7rem,2.6vw,2.4rem)] leading-none tracking-[-0.01em] tabular-nums">{s.value}</dd>
              <dt className="mt-2.5 font-mono text-[0.6rem] tracking-[0.1em] text-muted uppercase">{s.label}</dt>
            </div>
          ))}
        </dl>
      )}

      {event.paragraphs.length > 0 && (
        <div className="mt-10 max-w-[62ch] space-y-5 text-[0.98rem] leading-[1.7]">
          {event.paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      )}

      {event.timeline.length > 0 && <Timeline items={event.timeline} />}
      {event.spotlight && <SpotlightSection spotlight={event.spotlight} />}

      {event.parts.length > 0 && (
        <section aria-label="What we built" className="mt-14">
          <h3 className="font-mono text-[0.6rem] tracking-[0.1em] text-muted uppercase">What we built</h3>
          <ol className="mt-5 grid gap-px overflow-hidden rounded-[10px] border border-foreground/12 bg-foreground/12 sm:grid-cols-2">
            {event.parts.map((part, i) => (
              // With an odd count, the last part spans the row so no empty cell shows
              <li
                key={part.title}
                className={`bg-background p-5 ${event.parts.length % 2 === 1 && i === event.parts.length - 1 ? "sm:col-span-2" : ""}`}
              >
                <p className="font-mono text-[0.6rem] tracking-[0.08em] text-muted">({String(i + 1).padStart(2, "0")})</p>
                <p className="mt-2 text-base">{part.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{part.text}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      {gallery.length > 0 && (
        // Masonry: each photo keeps its own shape
        <ul className="mt-14 columns-1 gap-3 sm:columns-2">
          {gallery.map((img) => (
            <li key={img.src} className="mb-3 break-inside-avoid">
              <button
                type="button"
                onClick={() => open(event.images.indexOf(img))}
                aria-label={`View image ${event.images.indexOf(img) + 1} full screen`}
                className="group block w-full overflow-hidden bg-highlight"
              >
                <Image
                  src={img.src}
                  alt=""
                  width={img.width}
                  height={img.height}
                  sizes="(max-width: 640px) 100vw, 31vw"
                  className="h-auto w-full transition-transform duration-700 ease-out group-hover:scale-[1.02] motion-reduce:transition-none"
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      <dialog
        ref={dialogRef}
        onKeyDown={onKey}
        onClose={() => setViewing(0)}
        onClick={(e) => e.target === e.currentTarget && dialogRef.current?.close()}
        aria-label={`${event.title} ${viewing === "film" ? "film" : "images"}`}
        className="m-0 h-dvh max-h-none w-dvw max-w-none bg-black/94 p-0 text-white backdrop:bg-transparent"
      >
        {viewing === "film" && event.film ? (
          <video
            key={event.film}
            src={event.film}
            poster={event.poster ?? undefined}
            controls
            autoPlay
            playsInline
            className="absolute inset-6 h-[calc(100%-6rem)] w-[calc(100%-3rem)] object-contain sm:inset-14 sm:h-[calc(100%-9rem)] sm:w-[calc(100%-7rem)]"
          />
        ) : (
          shown && (
            <div className="pointer-events-none absolute inset-6 sm:inset-14">
              <Image
                src={shown.src}
                alt={`${event.title}, image ${(viewing as number) + 1} of ${event.images.length}`}
                fill
                sizes="100vw"
                className="object-contain"
              />
            </div>
          )
        )}
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-4 font-mono text-[0.65rem] tracking-[0.1em] uppercase sm:p-6">
          <span>{viewing === "film" ? event.title : `${(viewing as number) + 1} / ${event.images.length}`}</span>
          <div className="flex gap-2">
            {viewing !== "film" && event.images.length > 1 && (
              <>
                <button type="button" onClick={() => step(-1)} className="rounded-full border border-white/40 px-4 py-2 uppercase hover:bg-white/10">
                  Prev
                </button>
                <button type="button" onClick={() => step(1)} className="rounded-full border border-white/40 px-4 py-2 uppercase hover:bg-white/10">
                  Next
                </button>
              </>
            )}
            <button type="button" onClick={() => dialogRef.current?.close()} className="rounded-full border border-white/40 px-4 py-2 uppercase hover:bg-white/10">
              Close
            </button>
          </div>
        </div>
      </dialog>
    </article>
  );
}
