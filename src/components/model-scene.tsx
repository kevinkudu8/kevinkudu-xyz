"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

// Each model's code (and three.js with it) loads only when it's shown
const MODELS = {
  "pyusd-booth": () => import("@/lib/pyusd-booth").then((m) => m.mountBooth),
};
export type ModelName = keyof typeof MODELS;
export const isModel = (name: string | null | undefined): name is ModelName => !!name && name in MODELS;

/**
 * A 3D model that turns slowly; drag to turn it. Until its first frame is
 * drawn the frame stays empty with a quiet "Loading"; the fallback (a photo)
 * shows only if the model can't load, e.g. without WebGL.
 */
export function ModelScene({
  model,
  label,
  tone = "light",
  fallback,
}: {
  model: ModelName;
  label: string;
  /** The ground it sits on, for the loading text */
  tone?: "light" | "dark";
  fallback?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "failed">("loading");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let cancelled = false;
    let cleanup: (() => void) | undefined;
    MODELS[model]()
      .then((mount) => {
        if (cancelled) return;
        cleanup = mount(el, { onReady: () => setState("ready") });
      })
      .catch(() => !cancelled && setState("failed"));
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [model]);

  return (
    <>
      {state === "failed" && <div className="absolute inset-0">{fallback}</div>}
      <div
        ref={ref}
        role="img"
        aria-label={label}
        className={`absolute inset-0 transition-opacity duration-1000 ${state === "ready" ? "opacity-100" : "opacity-0"}`}
      />
      {state === "loading" && (
        <p
          className={`pointer-events-none absolute inset-0 grid place-items-center font-mono text-[0.6rem] tracking-[0.14em] uppercase motion-safe:animate-pulse ${
            tone === "dark" ? "text-white/35" : "text-muted"
          }`}
        >
          Loading
        </p>
      )}
      {state === "ready" && (
        <p className="pointer-events-none absolute bottom-4 left-4 hidden rounded-full bg-background/90 px-3.5 py-2 font-mono text-[0.6rem] tracking-[0.1em] uppercase backdrop-blur sm:block">
          3D render · Drag to turn
        </p>
      )}
    </>
  );
}
