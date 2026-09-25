"use client";

import Image from "next/image";
import { useRef, useState, useSyncExternalStore, type KeyboardEvent } from "react";
import type { EventEntry } from "@/lib/events";

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

function EventDetail({ event }: { event: EventEntry }) {
  const [hero, ...gallery] = event.images;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [viewing, setViewing] = useState(0);

  function open(index: number) {
    setViewing(index);
    dialogRef.current?.showModal();
  }

  function step(by: number) {
    setViewing((i) => (i + by + event.images.length) % event.images.length);
  }

  function onKey(e: KeyboardEvent<HTMLDialogElement>) {
    if (e.key === "ArrowRight") step(1);
    if (e.key === "ArrowLeft") step(-1);
  }

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

      {hero ? (
        <button
          type="button"
          onClick={() => open(0)}
          aria-label="View image full screen"
          className="group relative mt-8 block aspect-[16/9] w-full overflow-hidden bg-highlight"
        >
          <Image
            src={hero}
            alt={`${event.title}, image 1 of ${event.images.length}`}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 62vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.015] motion-reduce:transition-none"
          />
        </button>
      ) : (
        <div className="mt-8 grid aspect-[16/9] place-items-center bg-highlight font-mono text-xs tracking-[0.1em] text-muted uppercase">
          Images coming soon
        </div>
      )}

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

      {gallery.length > 0 && (
        <ul className="mt-12 grid gap-3 sm:grid-cols-2">
          {gallery.map((src, i) => (
            // With an odd count, the first image spans the row so the grid stays even
            <li key={src} className={gallery.length % 2 === 1 && i === 0 ? "sm:col-span-2" : undefined}>
              <button
                type="button"
                onClick={() => open(i + 1)}
                aria-label={`View image ${i + 2} full screen`}
                className="group relative block aspect-[16/9] w-full overflow-hidden bg-highlight"
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, 31vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02] motion-reduce:transition-none"
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      <dialog
        ref={dialogRef}
        onKeyDown={onKey}
        onClick={(e) => e.target === e.currentTarget && dialogRef.current?.close()}
        aria-label={`${event.title} images`}
        className="m-0 h-dvh max-h-none w-dvw max-w-none bg-black/92 p-0 text-white backdrop:bg-transparent"
      >
        {event.images[viewing] && (
          <div className="pointer-events-none absolute inset-6 sm:inset-14">
            <Image
              src={event.images[viewing]}
              alt={`${event.title}, image ${viewing + 1} of ${event.images.length}`}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-4 font-mono text-[0.65rem] tracking-[0.1em] uppercase sm:p-6">
          <span>
            {viewing + 1} / {event.images.length}
          </span>
          <div className="flex gap-2">
            {event.images.length > 1 && (
              <>
                <button type="button" onClick={() => step(-1)} className="rounded-full border border-white/40 px-4 py-2 hover:bg-white/10">
                  Prev
                </button>
                <button type="button" onClick={() => step(1)} className="rounded-full border border-white/40 px-4 py-2 hover:bg-white/10">
                  Next
                </button>
              </>
            )}
            <button type="button" onClick={() => dialogRef.current?.close()} className="rounded-full border border-white/40 px-4 py-2 hover:bg-white/10">
              Close
            </button>
          </div>
        </div>
      </dialog>
    </article>
  );
}
