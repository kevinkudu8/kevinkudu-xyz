"use client";

import Image from "next/image";
import { useState, type KeyboardEvent } from "react";
import type { Book } from "@/lib/books";

const tabs = [
  { id: "books", label: "Bookshelf" },
  { id: "movies", label: "Movie shelf" },
  { id: "running", label: "Running" },
  { id: "travel", label: "Travel" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export function Shelf({ books }: { books: Book[] }) {
  const [tab, setTab] = useState<TabId>("books");
  const [favouritesOnly, setFavouritesOnly] = useState(false);

  // Left/right arrows move between tabs, per the WAI-ARIA tabs pattern
  function onTabKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    const next = tabs[(index + step + tabs.length) % tabs.length];
    setTab(next.id);
    document.getElementById(`tab-${next.id}`)?.focus();
  }

  const shown = favouritesOnly ? books.filter((b) => b.favourite) : books;

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
              onClick={() => setTab(t.id)}
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

      {tabs.map((t) => (
        <section
          key={t.id}
          id={`panel-${t.id}`}
          role="tabpanel"
          aria-labelledby={`tab-${t.id}`}
          hidden={t.id !== tab}
        >
          {t.id === "books" ? (
            <>
              <div className="mt-6 flex items-center gap-3 font-mono text-[0.625rem] tracking-[0.1em] uppercase">
                <span className="text-muted">Filter:</span>
                <FilterPill active={!favouritesOnly} onClick={() => setFavouritesOnly(false)}>
                  All
                </FilterPill>
                <FilterPill active={favouritesOnly} onClick={() => setFavouritesOnly(true)}>
                  Favourites
                </FilterPill>
                <span className="ml-auto text-muted">
                  {shown.length} {shown.length === 1 ? "book" : "books"}
                </span>
              </div>

              {shown.length ? (
                <ul className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                  {shown.map((book) => (
                    <BookCard key={book.id} book={book} />
                  ))}
                </ul>
              ) : (
                <p className="mt-16 font-mono text-xs tracking-[0.1em] text-muted uppercase">
                  {books.length ? "No favourites yet." : "The shelf couldn't be loaded right now."}
                </p>
              )}
            </>
          ) : (
            <p className="mt-16 font-mono text-xs tracking-[0.1em] text-muted uppercase">
              Coming soon.
            </p>
          )}
        </section>
      ))}
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
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

function BookCard({ book }: { book: Book }) {
  const meta = [
    book.rating !== null && `${book.rating}/10`,
    book.year,
  ].filter(Boolean);

  return (
    <li className="group">
      <div className="relative aspect-[2/3] overflow-hidden rounded-[3px] bg-highlight shadow-[0_1px_0_rgb(0_0_0/0.04),0_14px_24px_-16px_rgb(0_0_0/0.45)] transition-transform duration-300 ease-out group-hover:-translate-y-1 motion-reduce:transition-none">
        {book.cover ? (
          <Image
            src={book.cover}
            alt={`Cover of ${book.title}`}
            fill
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 25vw, 15vw"
            unoptimized={book.cover.startsWith("/covers/")}
            className="object-cover"
          />
        ) : (
          <div className="flex h-full flex-col justify-between p-3 font-mono text-[0.625rem] leading-snug tracking-[0.08em] uppercase">
            <span className="line-clamp-5">{book.title}</span>
            <span className="text-muted">{book.author}</span>
          </div>
        )}
      </div>
      <p className="mt-3 line-clamp-2 text-sm leading-snug">{book.title}</p>
      <p className="mt-1 font-mono text-[0.625rem] tracking-[0.08em] text-muted uppercase">
        {book.author}
      </p>
      {(meta.length > 0 || book.favourite) && (
        <p className="mt-1 font-mono text-[0.625rem] tracking-[0.08em] text-muted uppercase">
          {book.favourite && (
            <span className="text-foreground" title="Favourite">
              ★{" "}
            </span>
          )}
          {meta.join(" · ")}
        </p>
      )}
    </li>
  );
}
