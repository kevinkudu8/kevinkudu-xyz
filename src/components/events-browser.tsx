"use client";

import Image from "next/image";
import { useRef, useState, useSyncExternalStore } from "react";
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
    <div className="grid gap-16 md:grid-cols-[minmax(14rem,21rem)_1fr] md:gap-[clamp(3rem,6vw,6.5rem)]">
      <aside className="self-start font-mono uppercase md:sticky md:top-10">
        <h1 className="text-[0.95rem] font-bold tracking-[0.06em]">Events and Experiential</h1>
        <p className="mt-7 max-w-[21rem] text-[0.8rem] leading-[1.9] tracking-[0.04em]">{intro}</p>

        <nav aria-label="Events" className="mt-14 md:mt-24">
          <ul className="space-y-5 md:space-y-7">
            {events.map((event) => {
              const active = event.slug === selected.slug;
              return (
                <li key={event.slug}>
                  <button
                    type="button"
                    onClick={() => choose(event.slug)}
                    aria-current={active ? "true" : undefined}
                    className={`text-left text-[0.95rem] tracking-[0.04em] uppercase transition-opacity sm:text-base ${
                      active ? "font-bold" : "hover:opacity-55"
                    }`}
                  >
                    {event.title}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      <div ref={detailRef} className="scroll-mt-6">
        <EventDetail key={selected.slug} event={selected} />
      </div>
    </div>
  );
}

function EventDetail({ event }: { event: EventEntry }) {
  const [index, setIndex] = useState(0);
  const image = event.images[index];

  return (
    <article aria-label={event.title}>
      {image ? (
        <div className="relative aspect-[16/9] overflow-hidden bg-highlight">
          <Image
            key={image}
            src={image}
            alt={`${event.title}, image ${index + 1} of ${event.images.length}`}
            fill
            priority={index === 0}
            sizes="(max-width: 768px) 100vw, 60vw"
            className="animate-[fade-in_0.4s_ease-out] object-cover motion-reduce:animate-none"
          />
        </div>
      ) : (
        <div className="grid aspect-[16/9] place-items-center bg-highlight font-mono text-xs tracking-[0.1em] text-muted uppercase">
          Images coming soon
        </div>
      )}

      {event.images.length > 1 && (
        <ul className="mt-3 grid grid-cols-5 gap-2.5">
          {event.images.map((src, i) => (
            <li key={src}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show image ${i + 1}`}
                aria-pressed={i === index}
                className={`relative block aspect-[16/9] w-full overflow-hidden bg-highlight transition-opacity ${
                  i === index ? "outline-2 outline-offset-2 outline-foreground" : "opacity-60 hover:opacity-100"
                }`}
              >
                <Image src={src} alt="" fill sizes="12vw" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-7 space-y-6 font-mono text-[0.68rem] leading-[2.4] tracking-[0.04em] uppercase">
        {event.paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </article>
  );
}
