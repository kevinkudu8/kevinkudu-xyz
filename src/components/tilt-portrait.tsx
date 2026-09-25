"use client";

import { useEffect, useRef, type ReactNode } from "react";

const MAX_TILT = 9; // degrees at the far edge of the screen
const PARALLAX = 10; // px the photo drifts inside its frame
const SMOOTHING = 0.085; // share of the remaining distance covered per 60fps frame

const clamp = (n: number) => Math.max(-1, Math.min(1, n));

/**
 * Tilts its contents toward the pointer anywhere on the page, with the photo
 * drifting slightly inside the frame for depth. Mouse and trackpad only;
 * stays flat for touch and for people who prefer reduced motion.
 */
export function TiltPortrait({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const photoRef = useRef<HTMLDivElement>(null);
  const sheenRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    const photo = photoRef.current;
    const sheen = sheenRef.current;
    if (!card || !photo || !sheen) return;

    const query = matchMedia(
      "(pointer: fine) and (prefers-reduced-motion: no-preference)",
    );
    if (!query.matches) return;

    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };
    let frame = 0;
    let last = 0;

    function render() {
      const { x, y } = current;
      const strength = Math.hypot(x, y) / Math.SQRT2;
      card!.style.transform = `rotateX(${-y * MAX_TILT}deg) rotateY(${x * MAX_TILT}deg)`;
      card!.style.boxShadow = `${-x * 18}px ${16 - y * 10}px 44px -20px rgb(0 0 0 / ${0.5 * strength})`;
      photo!.style.transform = `translate3d(${-x * PARALLAX}px, ${-y * PARALLAX}px, 0) scale(1.07)`;
      sheen!.style.opacity = String(0.55 * strength);
      sheen!.style.background = `radial-gradient(circle at ${50 + x * 45}% ${50 + y * 45}%, rgb(255 255 255 / 0.28), transparent 60%)`;
    }

    function tick(now: number) {
      const dt = last ? Math.min(now - last, 64) : 16.7;
      last = now;
      const k = 1 - Math.pow(1 - SMOOTHING, dt / 16.7);
      current.x += (target.x - current.x) * k;
      current.y += (target.y - current.y) * k;
      render();
      const settled =
        Math.abs(target.x - current.x) < 0.0005 &&
        Math.abs(target.y - current.y) < 0.0005;
      frame = settled ? 0 : requestAnimationFrame(tick);
      if (settled) last = 0;
    }

    function wake() {
      if (!frame) frame = requestAnimationFrame(tick);
    }

    function onMove(event: PointerEvent) {
      if (event.pointerType !== "mouse" && event.pointerType !== "pen") return;
      const r = card!.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      // Each screen edge maps to full tilt, however off-centre the portrait sits
      const dx = event.clientX - cx;
      const dy = event.clientY - cy;
      target.x = clamp(dx / (dx < 0 ? cx : innerWidth - cx));
      target.y = clamp(dy / (dy < 0 ? cy : innerHeight - cy));
      wake();
    }

    function onLeave() {
      target.x = 0;
      target.y = 0;
      wake();
    }

    photo.style.transform = "scale(1.07)";
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    window.addEventListener("blur", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", onLeave);
    };
  }, []);

  return (
    <div className={className} style={{ perspective: "900px" }}>
      <div
        ref={cardRef}
        className="relative h-full w-full overflow-hidden rounded-[inherit] [isolation:isolate] will-change-transform"
      >
        <div ref={photoRef} className="h-full w-full will-change-transform">
          {children}
        </div>
        <span
          ref={sheenRef}
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 mix-blend-soft-light"
        />
      </div>
    </div>
  );
}
