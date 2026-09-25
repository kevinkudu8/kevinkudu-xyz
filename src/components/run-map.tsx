"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import mapImage from "@/assets/run-map.svg";
import route from "@/data/run-route.json";

const ORANGE = "#ff4f1f";
const DURATION = 6500;
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * A run drawing itself across the map: the route traces out in orange with a
 * dot at its head while the distance counts up. Plays when it scrolls into view.
 */
export function RunMap() {
  const boxRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const headRef = useRef<SVGGElement>(null);
  const kmRef = useRef<HTMLSpanElement>(null);
  const frame = useRef(0);
  const [done, setDone] = useState(false);

  function draw(progress: number) {
    const path = pathRef.current;
    const head = headRef.current;
    if (!path || !head || !kmRef.current) return;
    const length = path.getTotalLength();
    path.style.strokeDasharray = `${length}`;
    path.style.strokeDashoffset = `${length * (1 - progress)}`;
    const point = path.getPointAtLength(length * progress);
    head.setAttribute("transform", `translate(${point.x} ${point.y})`);
    kmRef.current.textContent = (route.km * progress).toFixed(2);
  }

  function play() {
    cancelAnimationFrame(frame.current);
    setDone(false);
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION);
      draw(ease(t));
      if (t < 1) frame.current = requestAnimationFrame(tick);
      else setDone(true);
    };
    frame.current = requestAnimationFrame(tick);
  }

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      draw(1);
      return;
    }
    draw(0);
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        io.disconnect();
        play();
      }
    }, { threshold: 0.4 });
    io.observe(box);
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame.current);
    };
    // play/draw only touch refs; run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={boxRef}
      className="relative mt-12 aspect-[16/10] overflow-hidden rounded-[14px] border border-foreground/10 bg-[#ecece9]"
    >
      <Image src={mapImage} alt="" fill unoptimized className="object-cover" />
      <svg viewBox={`0 0 ${route.width} ${route.height}`} className="absolute inset-0 h-full w-full" aria-hidden>
        <path
          ref={pathRef}
          d={route.d}
          fill="none"
          stroke={ORANGE}
          strokeWidth={4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <g ref={headRef}>
          <circle r={11} fill={ORANGE} fillOpacity={0.18} />
          <circle r={5.5} fill={ORANGE} stroke="#fff" strokeWidth={2} />
        </g>
      </svg>

      <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-2 p-3 font-mono text-[0.58rem] tracking-[0.1em] uppercase sm:p-4 sm:text-[0.62rem]">
        <span className="rounded-full bg-background/85 px-3 py-1.5 backdrop-blur">Seoul</span>
        <span className="hidden rounded-full bg-background/85 px-3 py-1.5 backdrop-blur sm:inline">{route.label}</span>
        <span className="rounded-full border border-foreground/25 bg-background/85 px-3 py-1.5 text-muted backdrop-blur">
          Sample route
        </span>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#ecece9] via-[#ecece9]/70 to-transparent pt-16 pb-4 text-center sm:pb-6">
        <p className="text-[clamp(2.4rem,7vw,5.5rem)] leading-none font-light tracking-[-0.03em] tabular-nums">
          <span ref={kmRef}>{route.km.toFixed(2)}</span>
        </p>
        <p className="mt-1 font-mono text-[0.62rem] tracking-[0.12em] text-muted uppercase">km</p>
      </div>

      {done && (
        <button
          type="button"
          onClick={play}
          className="absolute right-3 bottom-3 rounded-full bg-foreground px-3.5 py-1.5 font-mono text-[0.58rem] tracking-[0.1em] text-background uppercase transition-opacity hover:opacity-85 sm:right-4 sm:bottom-4"
        >
          Replay
        </button>
      )}
    </div>
  );
}
