"use client";

import Image from "next/image";
import { useState, type KeyboardEvent, type ReactNode } from "react";
import type { ShelfItem } from "@/lib/shelf-item";

const PAGE = 24;

const tabs = [
  { id: "books", label: "Bookshelf", noun: ["book", "books"] },
  { id: "movies", label: "Movie shelf", noun: ["film", "films"] },
  { id: "running", label: "Running" },
  { id: "travel", label: "Travel" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export function Shelf({ books, films }: { books: ShelfItem[]; films: ShelfItem[] }) {
  const [tab, setTab] = useState<TabId>("books");
  const [favouritesOnly, setFavouritesOnly] = useState(true);
  const [visible, setVisible] = useState(PAGE);

  const items: Partial<Record<TabId, ShelfItem[]>> = { books, movies: films };

  function select(next: TabId) {
    setTab(next);
    setVisible(PAGE);
  }

  function filter(favourites: boolean) {
    setFavouritesOnly(favourites);
    setVisible(PAGE);
  }

  // Left/right arrows move between tabs, per the WAI-ARIA tabs pattern
  function onTabKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    const next = tabs[(index + step + tabs.length) % tabs.length];
    select(next.id);
    document.getElementById(`tab-${next.id}`)?.focus();
  }

  return (
    <div className="mt-14 sm:mt-20">
      <div
        role="tablist"
        aria-label="Shelves"
        className="flex gap-6 overflow-x-auto border-b border-foreground font-mono text-[0.7rem] tracking-[0.1em] uppercase sm:gap-10 sm:text-xs"
      >
        {tabs.map((t, i) => {
          const selected = t.id === tab;
          return (
            <button
              key={t.id}
              id={`tab-${t.id}`}
              role="tab"
              type="button"
              aria-selected={selected}
              aria-controls={`panel-${t.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => select(t.id)}
              onKeyDown={(e) => onTabKey(e, i)}
              className={`-mb-px shrink-0 border-b-2 px-1 pb-3 tracking-[inherit] whitespace-nowrap uppercase transition-colors ${
                selected
                  ? "border-foreground font-bold"
                  : "border-transparent text-muted hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {tabs.map((t) => {
        const all = items[t.id];
        const shown = all && favouritesOnly ? all.filter((item) => item.favourite) : all;
        return (
          <section
            key={t.id}
            id={`panel-${t.id}`}
            role="tabpanel"
            aria-labelledby={`tab-${t.id}`}
            hidden={t.id !== tab}
          >
            {all && shown && "noun" in t ? (
              <>
                <div className="mt-6 flex items-center gap-3 font-mono text-[0.625rem] tracking-[0.1em] uppercase">
                  <span className="text-muted">Filter:</span>
                  <FilterPill active={favouritesOnly} onClick={() => filter(true)}>
                    Favourites
                  </FilterPill>
                  <FilterPill active={!favouritesOnly} onClick={() => filter(false)}>
                    All
                  </FilterPill>
                  <span className="ml-auto text-muted">
                    {shown.length} {t.noun[shown.length === 1 ? 0 : 1]}
                  </span>
                </div>

                {shown.length ? (
                  <ul className="mt-12 grid grid-cols-2 gap-x-8 gap-y-14 sm:grid-cols-3 sm:gap-x-12 lg:grid-cols-4 lg:gap-x-[clamp(3rem,5vw,6rem)] lg:gap-y-20">
                    {shown.slice(0, visible).map((item) => (
                      <Card key={item.id} item={item} book={t.id === "books"} />
                    ))}
                  </ul>
                ) : (
                  <Empty>
                    {all.length ? "No favourites yet." : "This shelf couldn't be loaded right now."}
                  </Empty>
                )}

                {shown.length > visible && (
                  <div className="mt-16 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setVisible((v) => v + PAGE * 2)}
                      className="rounded-[3px] border border-foreground px-6 py-2.5 font-mono text-[0.625rem] tracking-[0.1em] uppercase transition-colors hover:bg-foreground hover:text-background"
                    >
                      Show more ({shown.length - visible})
                    </button>
                  </div>
                )}

                {t.id === "movies" && (
                  <p className="mt-16 max-w-prose font-mono text-[0.6rem] leading-relaxed tracking-[0.08em] text-muted uppercase">
                    Logged on{" "}
                    <a href="https://letterboxd.com/kevinkudu/" target="_blank" rel="me noreferrer" className="underline decoration-dotted underline-offset-2 hover:text-foreground">
                      Letterboxd
                    </a>
                    . Posters from TMDB. This product uses the TMDB API but is not endorsed or
                    certified by TMDB.
                  </p>
                )}
              </>
            ) : (
              <Empty>Coming soon.</Empty>
            )}
          </section>
        );
      })}
    </div>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="mt-16 font-mono text-xs tracking-[0.1em] text-muted uppercase">{children}</p>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-[3px] border px-4 py-1.5 tracking-[inherit] uppercase transition-colors ${
        active
          ? "border-foreground bg-foreground text-background"
          : "border-foreground hover:bg-foreground/5"
      }`}
    >
      {children}
    </button>
  );
}

/**
 * A cover with its caption. Books swing open in 3D on hover, showing their
 * page edges; posters just lift.
 */
function Card({ item, book }: { item: ShelfItem; book: boolean }) {
  // Draw the cover at its true shape inside a 2:3 slot, standing on the slot's
  // bottom edge, so nothing is cropped and captions still line up per row.
  const aspect = item.aspect ?? null;
  const fit = !aspect ? "h-full w-full" : aspect >= 2 / 3 ? "w-full" : "h-full";

  const object = (
    <div className="relative flex aspect-[2/3] items-end [perspective:1400px]">
      <div
        style={aspect ? { aspectRatio: String(aspect) } : undefined}
        className={`relative ${fit} transition-transform duration-500 ease-[cubic-bezier(0.2,0.7,0.2,1)] [transform-style:preserve-3d] motion-reduce:transition-none ${
          book
            ? "group-hover:[transform:rotateY(-26deg)_translateX(-6%)_scale(1.04)] motion-reduce:group-hover:[transform:none]"
            : "group-hover:-translate-y-1 group-focus-within:-translate-y-1"
        }`}
      >
        <div className="absolute inset-0 overflow-hidden rounded-[2px] bg-highlight shadow-[0_1px_0_rgb(0_0_0/0.04),0_16px_28px_-18px_rgb(0_0_0/0.5)] transition-shadow duration-500 group-hover:shadow-[0_1px_0_rgb(0_0_0/0.04),0_26px_40px_-20px_rgb(0_0_0/0.55)]">
          {item.image ? (
            <Image
              src={item.image}
              alt={`Cover of ${item.title}`}
              fill
              sizes="(max-width: 640px) 40vw, 13rem"
              unoptimized={item.imageUnoptimized}
              className="object-cover"
            />
          ) : (
            <div className="flex h-full flex-col justify-between p-3 font-mono text-[0.6rem] leading-snug tracking-[0.08em] uppercase">
              <span className="line-clamp-6">{item.title}</span>
              <span className="text-muted">{item.byline}</span>
            </div>
          )}
        </div>
        {book && (
          // Fore-edge: perpendicular to the cover, hidden edge-on until the book turns
          <span
            aria-hidden
            className="absolute top-[1.5%] bottom-[1.5%] left-full w-[10.5%] origin-left [transform:rotateY(90deg)] bg-[repeating-linear-gradient(to_right,#f6f4ec_0_1px,#dedad0_1px_2px)] shadow-[inset_-2px_0_0_rgb(0_0_0/0.3)]"
          />
        )}
      </div>
    </div>
  );

  const caption = (
    <>
      <p className="mt-5 line-clamp-2 text-sm leading-snug font-medium">{item.title}</p>
      <p className="mt-1 line-clamp-1 text-sm text-muted">{item.byline}</p>
      {item.meta && (
        <p className="mt-2 font-mono text-[0.6rem] tracking-[0.1em] text-muted uppercase">
          {item.meta}
        </p>
      )}
    </>
  );

  return (
    <li className="group w-full max-w-[clamp(8.5rem,12vw,12.5rem)]">
      {item.href ? (
        <a href={item.href} target="_blank" rel="noreferrer" className="block focus-visible:outline-offset-8">
          {object}
          {caption}
        </a>
      ) : (
        <>
          {object}
          {caption}
        </>
      )}
    </li>
  );
}
