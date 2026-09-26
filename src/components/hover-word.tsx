"use client";

import Link from "next/link";
import { useRef, type ReactNode } from "react";

const EDGE = 16;

/**
 * A highlighted word that floats a preview card above itself on hover or
 * keyboard focus. With `href` the word is a link; without it the word is
 * focusable so touch and keyboard users can still open the card.
 */
export function HoverWord({
  children,
  card,
  href,
}: {
  children: ReactNode;
  card: ReactNode;
  href?: "/events" | "/content" | "/my-life";
}) {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const cardRef = useRef<HTMLSpanElement>(null);

  // Keep the card inside the viewport by nudging it sideways before it shows.
  function place() {
    const anchor = anchorRef.current;
    const card = cardRef.current;
    if (!anchor || !card) return;
    anchor.style.setProperty("--shift", "0px");
    const { left, right } = card.getBoundingClientRect();
    const max = document.documentElement.clientWidth - EDGE;
    const shift = left < EDGE ? EDGE - left : right > max ? max - right : 0;
    anchor.style.setProperty("--shift", `${shift}px`);
  }

  const word = <mark>{children}</mark>;

  return (
    <span
      ref={anchorRef}
      className="group relative inline-block"
      onPointerEnter={place}
      onFocus={place}
    >
      {href ? (
        <Link href={href} className="rounded-md outline-offset-4">
          {word}
        </Link>
      ) : (
        <span tabIndex={0} className="cursor-default rounded-md outline-offset-4">
          {word}
        </span>
      )}

      <span
        ref={cardRef}
        aria-hidden
        className="pointer-events-none absolute bottom-[calc(100%+0.6rem)] left-[calc(50%+var(--shift,0px))] z-20 block w-[min(20rem,calc(100vw-2rem))] -translate-x-1/2"
      >
        <span className="invisible block origin-bottom translate-y-1.5 scale-[0.97] overflow-hidden rounded-[14px] border-2 border-foreground bg-background opacity-0 shadow-[0_14px_32px_-14px_rgb(0_0_0/0.35)] transition-[opacity,translate,scale,visibility] duration-200 ease-out group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:scale-100 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100 motion-reduce:translate-y-0 motion-reduce:scale-100 motion-reduce:transition-opacity">
          {/* Every card shares the Seoul map's proportions (600×361) */}
          <span className="relative block aspect-[600/361] w-full">{card}</span>
        </span>
      </span>
    </span>
  );
}
