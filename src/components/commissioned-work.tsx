"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { youtubeEmbed, youtubeThumb } from "@/lib/youtube";

export type Commissioned = {
  intro: string;
  stats: { value: string; label: string }[];
  clients: string[];
  groups: {
    title: string;
    text: string;
    image?: string;
    videos?: { youtube: string; title: string; meta?: string }[];
  }[];
};

/** Client and production work, grouped by type; videos play in a full-screen viewer. */
export function CommissionedWork({ data }: { data: Commissioned }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [playing, setPlaying] = useState<{ youtube: string; title: string } | null>(null);

  function play(video: { youtube: string; title: string }) {
    setPlaying(video);
    dialogRef.current?.showModal();
  }

  return (
    <div className="mx-auto w-full max-w-[1100px]">
      <p className="max-w-[60ch] text-[1.05rem] leading-[1.7]">{data.intro}</p>

      <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-foreground pt-7 sm:grid-cols-4">
        {data.stats.map((s) => (
          <div key={s.label}>
            <dd className="text-[clamp(1.7rem,2.6vw,2.4rem)] leading-none tracking-[-0.01em] tabular-nums">{s.value}</dd>
            <dt className="mt-2.5 font-mono text-[0.6rem] tracking-[0.1em] text-muted uppercase">{s.label}</dt>
          </div>
        ))}
      </dl>

      <p className="mt-10 font-mono text-[0.62rem] leading-[2] tracking-[0.1em] text-muted uppercase">
        <span className="mr-3 text-foreground">Clients</span>
        {data.clients.join("  ·  ")}
      </p>

      <div className="mt-16 space-y-16">
        {data.groups.map((group, g) => (
          <section key={group.title} aria-label={group.title} className="border-t border-foreground/15 pt-6">
            <div className="grid gap-3 md:grid-cols-[16rem_1fr] md:gap-10">
              <div>
                <p className="font-mono text-[0.6rem] tracking-[0.08em] text-muted">({String(g + 1).padStart(2, "0")})</p>
                <h3 className="mt-2 text-xl tracking-[-0.01em]">{group.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{group.text}</p>
              </div>

              {group.videos && (
                <ul className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                  {group.videos.map((video) => (
                    <li key={video.youtube}>
                      <button type="button" onClick={() => play(video)} className="group block w-full text-left">
                        <span className="relative block aspect-video overflow-hidden bg-highlight">
                          <Image
                            src={youtubeThumb(video.youtube)}
                            alt=""
                            fill
                            sizes="(max-width: 640px) 100vw, 26rem"
                            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03] motion-reduce:transition-none"
                          />
                          <span
                            aria-hidden
                            className="absolute bottom-3 left-3 grid size-8 place-items-center rounded-full bg-[#ff4f1f] text-[0.6rem] text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                          >
                            ▶
                          </span>
                        </span>
                        <span className="mt-2.5 block text-sm">{video.title}</span>
                        {video.meta && (
                          <span className="mt-0.5 block font-mono text-[0.58rem] tracking-[0.08em] text-muted uppercase">
                            {video.meta}
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {group.image && (
                <div className="relative aspect-video overflow-hidden bg-highlight md:max-w-[26rem]">
                  <Image src={group.image} alt="" fill sizes="26rem" className="object-cover" />
                </div>
              )}
            </div>
          </section>
        ))}
      </div>

      <dialog
        ref={dialogRef}
        onClose={() => setPlaying(null)}
        onClick={(e) => e.target === e.currentTarget && dialogRef.current?.close()}
        aria-label={playing?.title ?? "Video"}
        className="m-0 h-dvh max-h-none w-dvw max-w-none bg-black/94 p-0 text-white backdrop:bg-transparent"
      >
        {playing && (
          <div className="flex h-full flex-col">
            <div className="relative m-6 flex-1 sm:m-14">
              <iframe
                src={youtubeEmbed(playing.youtube)}
                title={playing.title}
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                className="absolute inset-0 h-full w-full"
              />
            </div>
            <div className="flex items-center justify-between gap-6 p-4 font-mono text-[0.65rem] tracking-[0.1em] uppercase sm:p-6">
              <span>{playing.title}</span>
              <button type="button" onClick={() => dialogRef.current?.close()} className="rounded-full border border-white/40 px-4 py-2 uppercase hover:bg-white/10">
                Close
              </button>
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
}
