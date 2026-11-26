"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { WorkFilm } from "@/lib/work-films";
import { embedUrl } from "@/lib/video";

/**
 * Every film in a two-column grid of silent looping previews, edge to edge.
 * Clicking a film plays the full version in a full-screen viewer.
 */
export function FilmGrid({ films }: { films: WorkFilm[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState<WorkFilm | null>(null);

  function play(film: WorkFilm) {
    if (film.link && !film.video && !embedUrl(film.link)) {
      window.open(film.link, "_blank", "noopener,noreferrer");
      return;
    }
    setOpen(film);
    dialogRef.current?.showModal();
  }

  const embed = open && !open.video ? embedUrl(open.link) : null;

  return (
    <>
      <ul className="grid grid-cols-1 gap-x-5 gap-y-9 md:grid-cols-2 md:gap-y-11">
        {films.map((film) => (
          <FilmTile key={film.slug} film={film} onPlay={() => play(film)} />
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
              {embed ? (
                <iframe
                  src={embed}
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
                  {[...open.details, open.runtime].filter(Boolean).join(" · ")}
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

function FilmTile({ film, onPlay }: { film: WorkFilm; onPlay: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Loops play only while on screen, and never for people who prefer reduced motion
  useEffect(() => {
    const video = videoRef.current;
    if (!video || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? void video.play().catch(() => {}) : video.pause()),
      { rootMargin: "200px 0px", threshold: 0.1 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <li className="min-w-0">
      <button
        type="button"
        onClick={onPlay}
        aria-label={`Play ${film.title}`}
        className="relative block aspect-video w-full overflow-hidden bg-highlight md:aspect-[11/8]"
      >
        {film.poster && (
          <Image src={film.poster} alt="" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
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
            // Fade in once frames arrive, so there's no black flash over the still
            onPlaying={(e) => e.currentTarget.classList.remove("opacity-0")}
            className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-700"
          />
        )}

      </button>

      <div className="mt-2.5 text-[13px] leading-[1.15] font-medium tracking-[0.01em]">
        <p className="truncate">{film.title}</p>
        {film.details.length > 0 && <p className="mt-0.5 truncate opacity-40">{film.details.join(", ")}</p>}
      </div>
    </li>
  );
}
