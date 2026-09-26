"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import type { WorkFilm } from "@/lib/work-films";
import { youtubeEmbed, youtubeId } from "@/lib/youtube";

/**
 * A row of portrait cards. The hovered (or focused) card widens and reveals
 * its details, playing its preview loop if it has one; clicking opens the film.
 */
export function FilmRow({ films }: { films: WorkFilm[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState<WorkFilm | null>(null);

  function play(film: WorkFilm) {
    if (film.link && !film.video && !youtubeId(film.link)) {
      window.open(film.link, "_blank", "noopener,noreferrer");
      return;
    }
    setOpen(film);
    dialogRef.current?.showModal();
  }

  return (
    <>
      {/* Wide screens: a row of small cards; the hovered one grows into its gaps */}
      <ul className="hidden h-[calc(var(--w)*1.35*1.365+5rem)] items-center justify-center [--g:calc(var(--w)*0.31)] [--w:clamp(6.5rem,9.85vw,12.5rem)] lg:flex">
        {films.map((film, i) => (
          <FilmCard key={film.slug} film={film} index={i} onPlay={() => play(film)} />
        ))}
      </ul>

      {/* Phones and tablets: no hover, so a grid with captions */}
      <ul className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:hidden">
        {films.map((film) => (
          <li key={film.slug}>
            <button
              type="button"
              onClick={() => play(film)}
              aria-label={`Play ${film.title}`}
              className="relative block aspect-[4/5] w-full overflow-hidden bg-highlight"
            >
              {film.poster && <Image src={film.poster} alt="" fill sizes="(max-width: 640px) 50vw, 33vw" className="object-cover" />}
            </button>
            <p className="mt-3 text-sm leading-snug">{film.title}</p>
            <p className="mt-1 font-mono text-[0.58rem] tracking-[0.08em] text-muted uppercase">{film.details.join(" · ")}</p>
          </li>
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
              {youtubeId(open.link) && !open.video ? (
                <iframe
                  src={youtubeEmbed(youtubeId(open.link)!)}
                  title={open.title}
                  allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                  allowFullScreen
                  className="absolute inset-0 h-full w-full"
                />
              ) : open.video ? (
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

function FilmCard({ film, index, onPlay }: { film: WorkFilm; index: number; onPlay: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const start = () => void videoRef.current?.play().catch(() => {});
  const stop = () => {
    const v = videoRef.current;
    if (v) {
      v.pause();
      v.currentTime = 0;
    }
  };
  const type = film.details[0];

  return (
    <li
      onPointerEnter={start}
      onPointerLeave={stop}
      onFocus={start}
      onBlur={stop}
      // Grows by ~48% wide / ~37% tall, giving back the same width from its
      // margins, so the neighbouring cards stay put and only the gaps close up
      className="group relative mx-[calc(var(--g)/2)] h-[calc(var(--w)*1.35)] w-(--w) shrink-0 transition-[width,height,margin] duration-500 ease-[cubic-bezier(0.2,0.7,0.2,1)] hover:mx-[calc(var(--g)/2-var(--w)*0.24)] hover:h-[calc(var(--w)*1.35*1.365)] hover:w-[calc(var(--w)*1.48)] focus-within:mx-[calc(var(--g)/2-var(--w)*0.24)] focus-within:h-[calc(var(--w)*1.35*1.365)] focus-within:w-[calc(var(--w)*1.48)] motion-reduce:transition-none"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-full left-0 mb-2.5 font-mono text-[0.72rem] tracking-[0.04em] opacity-0 transition-opacity duration-300 group-focus-within:opacity-100 group-focus-within:delay-150 group-hover:opacity-100 group-hover:delay-150"
      >
        ({String(index + 1).padStart(2, "0")})
      </span>

      <button
        type="button"
        onClick={onPlay}
        aria-label={`Play ${film.title}${type ? `, ${type}` : ""}`}
        className="relative block h-full w-full overflow-hidden bg-highlight"
      >
        {film.poster && (
          <Image src={film.poster} alt="" fill sizes="(max-width: 1440px) 21vw, 19rem" className="object-cover" />
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
      </button>

      <span
        aria-hidden
        className="pointer-events-none absolute top-full left-0 mt-2.5 font-mono text-[0.72rem] tracking-[0.02em] whitespace-nowrap opacity-0 transition-opacity duration-300 group-focus-within:opacity-100 group-focus-within:delay-150 group-hover:opacity-100 group-hover:delay-150"
      >
        {film.title}
        {type && ` / ${type}`}
        {film.sample && <span className="ml-2 text-muted">(sample)</span>}
      </span>
    </li>
  );
}
