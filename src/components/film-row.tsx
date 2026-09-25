"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import type { WorkFilm } from "@/lib/work-films";

/**
 * A row of portrait cards. The hovered (or focused) card widens and reveals
 * its details, playing its preview loop if it has one; clicking opens the film.
 */
export function FilmRow({ films }: { films: WorkFilm[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState<WorkFilm | null>(null);

  function play(film: WorkFilm) {
    if (film.link && !film.video) {
      window.open(film.link, "_blank", "noopener,noreferrer");
      return;
    }
    setOpen(film);
    dialogRef.current?.showModal();
  }

  return (
    <>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-10 sm:flex sm:h-[clamp(20rem,34vw,30rem)] sm:gap-4">
        {films.map((film) => (
          <FilmCard key={film.slug} film={film} onPlay={() => play(film)} />
        ))}
      </ul>

      <dialog
        ref={dialogRef}
        onClose={() => setOpen(null)}
        onClick={(e) => e.target === e.currentTarget && dialogRef.current?.close()}
        aria-label={open ? open.title : "Film"}
        className="m-0 h-dvh max-h-none w-dvw max-w-none bg-black/94 p-0 text-white backdrop:bg-transparent"
      >
        {open && (
          <div className="flex h-full flex-col">
            <div className="relative m-6 flex-1 sm:m-14">
              {open.video ? (
                <video
                  key={open.video}
                  src={open.video}
                  poster={open.poster ?? undefined}
                  controls
                  autoPlay
                  playsInline
                  className="absolute inset-0 h-full w-full object-contain"
                />
              ) : (
                open.poster && (
                  <>
                    <Image src={open.poster} alt="" fill sizes="100vw" className="object-contain opacity-60" />
                    <p className="absolute inset-x-0 bottom-6 text-center font-mono text-[0.65rem] tracking-[0.12em] uppercase">
                      Video coming soon
                    </p>
                  </>
                )
              )}
            </div>
            <div className="flex items-end justify-between gap-6 p-4 sm:p-6">
              <div>
                <p className="text-lg">{open.title}</p>
                <p className="mt-1 font-mono text-[0.6rem] tracking-[0.1em] text-white/60 uppercase">
                  {open.details.join(" · ")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => dialogRef.current?.close()}
                className="shrink-0 rounded-full border border-white/40 px-4 py-2 font-mono text-[0.65rem] tracking-[0.1em] uppercase hover:bg-white/10"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}

function FilmCard({ film, onPlay }: { film: WorkFilm; onPlay: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const start = () => void videoRef.current?.play().catch(() => {});
  const stop = () => {
    const v = videoRef.current;
    if (v) {
      v.pause();
      v.currentTime = 0;
    }
  };

  return (
    <li
      onPointerEnter={start}
      onPointerLeave={stop}
      onFocus={start}
      onBlur={stop}
      className="group relative min-w-0 transition-[flex-grow] duration-500 ease-[cubic-bezier(0.2,0.7,0.2,1)] sm:flex-1 sm:hover:flex-[2.6] sm:focus-within:flex-[2.6] motion-reduce:transition-none"
    >
      <button
        type="button"
        onClick={onPlay}
        aria-label={`Play ${film.title}`}
        className="relative block aspect-[4/5] w-full overflow-hidden bg-highlight sm:aspect-auto sm:h-full"
      >
        {film.poster && (
          <Image
            src={film.poster}
            alt=""
            fill
            sizes="(max-width: 640px) 50vw, 40vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03] motion-reduce:transition-none"
          />
        )}
        {film.preview && (
          <video
            ref={videoRef}
            src={film.preview}
            muted
            loop
            playsInline
            preload="none"
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          />
        )}
        {/* Details: revealed on hover/focus on wide screens */}
        <span className="pointer-events-none absolute inset-x-0 bottom-0 hidden bg-gradient-to-t from-black/75 via-black/30 to-transparent p-5 pt-16 text-left text-white opacity-0 transition-opacity duration-300 group-focus-within:opacity-100 group-hover:opacity-100 sm:block">
          {film.sample && (
            <span className="mb-3 inline-block rounded-full border border-white/40 px-2.5 py-0.5 font-mono text-[0.55rem] tracking-[0.12em] uppercase">
              Sample content
            </span>
          )}
          <span className="block text-xl leading-tight whitespace-nowrap">{film.title}</span>
          <span className="mt-1.5 block font-mono text-[0.6rem] tracking-[0.1em] whitespace-nowrap text-white/75 uppercase">
            {film.details.join(" · ")}
          </span>
          {film.description && (
            <span className="mt-3 line-clamp-2 block max-w-[34ch] text-[0.8rem] leading-snug text-white/85">
              {film.description}
            </span>
          )}
        </span>
      </button>

      {/* On phones there's no hover, so details sit under the still */}
      <div className="mt-3 sm:hidden">
        <p className="text-sm leading-snug">{film.title}</p>
        <p className="mt-1 font-mono text-[0.58rem] tracking-[0.08em] text-muted uppercase">
          {film.details.join(" · ")}
        </p>
      </div>
    </li>
  );
}
