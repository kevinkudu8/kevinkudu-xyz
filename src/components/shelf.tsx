"use client";

import Image from "next/image";
import { useMemo, useState, useSyncExternalStore, type KeyboardEvent, type ReactNode } from "react";
import type { ShelfItem } from "@/lib/shelf-item";

const PAGE = 24;

const tabs = [
  { id: "books", label: "Books", noun: ["book", "books"], groups: "Type" },
  { id: "movies", label: "Movies", noun: ["film", "films"], groups: "Decade" },
  { id: "running", label: "Running" },
  { id: "travel", label: "Travel" },
] as const;

type TabId = (typeof tabs)[number]["id"];

// One random number per page load, for shuffling the movie favourites. Read
// through useSyncExternalStore so the server render (unshuffled) hydrates
// cleanly and the client then shows its own order.
const pageSeed = typeof window === "undefined" ? 0 : Math.random() * 2 ** 32;
const readSeed = () => pageSeed;
const noSubscribe = () => () => {};

/** A seeded Fisher–Yates shuffle, so the order holds steady while the page is open. */
function shuffled<T>(items: T[], seed: number): T[] {
  if (!seed) return items;
  const out = [...items];
  let s = seed >>> 0;
  const rand = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Decades newest first; book types in a fixed order
const groupOrder = (a: string, b: string) => (/^\d/.test(a) ? b.localeCompare(a) : a.localeCompare(b));

export function Shelf({
  books,
  films,
  running,
  travel,
}: {
  books: ShelfItem[];
  films: ShelfItem[];
  running: ReactNode;
  travel: ReactNode;
}) {
  const [tab, setTab] = useState<TabId>("books");
  const [favouritesOnly, setFavouritesOnly] = useState(true);
  const [group, setGroup] = useState<Partial<Record<TabId, string | null>>>({});
  const [visible, setVisible] = useState(PAGE);
  const seed = useSyncExternalStore(noSubscribe, readSeed, () => 0);

  // Movie favourites come in a random order each visit
  const shuffledFilms = useMemo(() => {
    const favourites = shuffled(
      films.filter((f) => f.favourite),
      seed,
    );
    return [...favourites, ...films.filter((f) => !f.favourite)];
  }, [films, seed]);
  const items: Partial<Record<TabId, ShelfItem[]>> = { books, movies: shuffledFilms };

  function select(next: TabId) {
    setTab(next);
    setVisible(PAGE);
  }

  function filter(favourites: boolean) {
    setFavouritesOnly(favourites);
    setVisible(PAGE);
  }

  function pickGroup(id: TabId, value: string | null) {
    setGroup((g) => ({ ...g, [id]: value }));
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
        className="flex flex-wrap items-baseline gap-x-[clamp(1.1rem,2.2vw,2rem)] gap-y-2 text-[clamp(1.05rem,1.4vw,1.3rem)] leading-none tracking-[-0.01em]"
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
              className={`shrink-0 whitespace-nowrap transition-colors duration-300 ${
                selected ? "text-foreground" : "text-muted/55 hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {tabs.map((t) => {
        const all = items[t.id];
        const pool = all && favouritesOnly ? all.filter((item) => item.favourite) : all;
        // Only groups with something in the current view (a decade with no favourites isn't offered)
        const groups = pool ? [...new Set(pool.map((item) => item.group).filter((g): g is string => !!g))].sort(groupOrder) : [];
        const chosen = group[t.id] ?? null;
        const active = chosen && groups.includes(chosen) ? chosen : null;
        const shown = pool && active ? pool.filter((item) => item.group === active) : pool;
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
                <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 font-mono text-[0.625rem] tracking-[0.1em] uppercase">
                  <Toggle favouritesOnly={favouritesOnly} onChange={filter} />
                  {groups.length > 1 && (
                    <FilterSelect
                      label={t.groups}
                      value={active}
                      options={groups}
                      onChange={(value) => pickGroup(t.id, value)}
                    />
                  )}
                  <span className="ml-auto text-muted">
                    {shown.length} {t.noun[shown.length === 1 ? 0 : 1]}
                    {t.id === "movies" && favouritesOnly && " · in random order"}
                  </span>
                </div>


                {shown.length ? (
                  <ul
                    className={
                      t.id === "movies"
                        ? // Posters sit small in square cells, divided by hairlines (the gap shows the line colour)
                          "mt-10 grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6"
                        : "mt-12 grid grid-cols-2 justify-center gap-x-6 gap-y-12 sm:grid-cols-[repeat(3,clamp(8.5rem,12vw,12.5rem))] sm:gap-x-10 lg:grid-cols-[repeat(4,clamp(8.5rem,12vw,12.5rem))] lg:gap-x-[clamp(2rem,3.5vw,4rem)] lg:gap-y-16"
                    }
                  >
                    {shown.slice(0, visible).map((item) =>
                      t.id === "movies" ? (
                        <PosterCell key={item.id} item={item} />
                      ) : (
                        <Card key={item.id} item={item} book />
                      ),
                    )}
                  </ul>
                ) : (
                  <Empty>
                    {!all.length
                      ? "This shelf couldn't be loaded right now."
                      : active
                        ? `No ${favouritesOnly ? "favourites" : t.noun[1]} from ${active} yet.`
                        : "No favourites yet."}
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

              </>
            ) : t.id === "running" ? (
              running
            ) : t.id === "travel" ? (
              travel
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

/** Favourites / All as one switch; the filled thumb slides to the chosen side. */
function Toggle({ favouritesOnly, onChange }: { favouritesOnly: boolean; onChange: (favourites: boolean) => void }) {
  return (
    <div role="group" aria-label="Show" className="relative grid grid-cols-2 rounded-full bg-foreground/[0.06]">
      <span
        aria-hidden
        className={`absolute inset-y-0 left-0 w-1/2 rounded-full bg-foreground transition-transform duration-300 ease-[cubic-bezier(0.2,0.7,0.2,1)] motion-reduce:transition-none ${
          favouritesOnly ? "" : "translate-x-full"
        }`}
      />
      {([true, false] as const).map((fav) => {
        const on = favouritesOnly === fav;
        return (
          <button
            key={String(fav)}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(fav)}
            className={`relative rounded-full px-3.5 py-1 tracking-[inherit] uppercase transition-colors duration-300 ${
              on ? "text-background" : "text-muted hover:text-foreground"
            }`}
          >
            {fav ? "Favourites" : "All"}
          </button>
        );
      })}
    </div>
  );
}

/**
 * A quiet text dropdown: muted while set to "any", full colour once a value is
 * chosen. A native select, so it works with keyboard and screen readers, and
 * on phones opens the system picker.
 */
function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | null;
  options: string[];
  onChange: (value: string | null) => void;
}) {
  const on = value !== null;
  return (
    <label
      className={`relative inline-flex items-center transition-colors has-[select:focus-visible]:outline-2 has-[select:focus-visible]:outline-offset-4 ${
        on ? "text-foreground" : "text-muted hover:text-foreground"
      }`}
    >
      {/* Sized by this visible label; the real select sits invisibly over it */}
      <span aria-hidden className="border-b border-dotted border-current py-1 pr-4 whitespace-nowrap">
        {label} <span className={on ? "font-bold" : undefined}>{value ?? "Any"}</span>
      </span>
      <select
        aria-label={label}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        className="absolute inset-0 w-full cursor-pointer appearance-none opacity-0 [&_option]:bg-background [&_option]:text-foreground"
      >
        <option value="">{`${label}: Any`}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {`${label}: ${o}`}
          </option>
        ))}
      </select>
      <svg aria-hidden viewBox="0 0 10 6" className="pointer-events-none absolute right-0 w-[7px] fill-current">
        <path d="M0 0h10L5 6Z" />
      </svg>
    </label>
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
            className="absolute top-[1.5%] bottom-[1.5%] left-full w-[13.65%] origin-left [transform:rotateY(90deg)] bg-[repeating-linear-gradient(to_right,#f6f4ec_0_1px,#dedad0_1px_2px)] shadow-[inset_-2px_0_0_rgb(0_0_0/0.3)]"
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
    <li className="group">
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

/**
 * A film poster, small and centred in a square cell, like prints laid out on
 * a table. Its title, year and watch date appear below it on hover or focus.
 */
function PosterCell({ item }: { item: ShelfItem }) {
  const poster = (
    <div className="relative aspect-[2/3] w-full overflow-hidden rounded-[2px] bg-highlight shadow-[0_1px_0_rgb(0_0_0/0.04),0_14px_24px_-16px_rgb(0_0_0/0.55)] transition-transform duration-500 ease-[cubic-bezier(0.2,0.7,0.2,1)] group-hover:-translate-y-1 group-focus-visible:-translate-y-1 motion-reduce:transition-none">
      {item.image ? (
        <Image
          src={item.image}
          alt={`Poster for ${item.title}`}
          fill
          sizes="(max-width: 640px) 26vw, 10rem"
          unoptimized={item.imageUnoptimized}
          className="object-cover"
        />
      ) : (
        <span className="flex h-full items-center p-2 text-center font-mono text-[0.5rem] leading-snug tracking-[0.06em] uppercase">
          {item.title}
        </span>
      )}
    </div>
  );
  // The details sit in reserved space below the poster, out of sight until
  // hovered or focused, so the grid never shifts
  const details = (
    <span className="mt-3 block min-h-[3.4rem] w-full px-1.5 text-center opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
      <span className="line-clamp-2 text-[0.72rem] leading-snug font-medium">{item.title}</span>
      <span className="mt-0.5 block font-mono text-[0.52rem] leading-relaxed tracking-[0.08em] text-muted uppercase">
        {[item.byline, item.meta].filter(Boolean).join(" · ")}
      </span>
    </span>
  );
  const cell = "group flex flex-col items-center px-2 pt-[10%] pb-[4%]";
  return (
    <li className="flex" data-shelf-id={item.id}>
      {item.href ? (
        <a
          href={item.href}
          target="_blank"
          rel="noreferrer"
          aria-label={`${item.title}${item.byline ? ` (${item.byline})` : ""} on Letterboxd`}
          className={`${cell} w-full focus-visible:-outline-offset-4`}
        >
          <span className="block w-[67%]">{poster}</span>
          {details}
        </a>
      ) : (
        <div className={`${cell} w-full`}>
          <span className="block w-[67%]">{poster}</span>
          {details}
        </div>
      )}
    </li>
  );
}
