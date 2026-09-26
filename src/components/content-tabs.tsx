"use client";

import { useSyncExternalStore, type ReactNode } from "react";

const subscribe = (onChange: () => void) => {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
};

/** Films / Commissioned toggle; the choice lives in the URL hash so it can be linked. */
export function ContentTabs({ films, commissioned }: { films: ReactNode; commissioned: ReactNode }) {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash, () => "");
  const tab = hash === "#commissioned" ? "commissioned" : "films";

  function select(next: "films" | "commissioned") {
    history.replaceState(null, "", next === "films" ? location.pathname : "#commissioned");
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  }

  return (
    <>
      <div role="tablist" aria-label="Content" className="flex justify-center gap-6 font-mono text-[0.7rem] tracking-[0.12em] uppercase">
        {(["films", "commissioned"] as const).map((id) => (
          <button
            key={id}
            role="tab"
            type="button"
            aria-selected={tab === id}
            onClick={() => select(id)}
            className={`border-b pb-1 tracking-[inherit] uppercase transition-colors ${
              tab === id ? "border-foreground" : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {id === "films" ? "Films" : "Commissioned"}
          </button>
        ))}
      </div>
      <div role="tabpanel" className={tab === "films" ? "flex flex-1 flex-col justify-center py-16" : "hidden"}>
        {films}
      </div>
      <div role="tabpanel" className={tab === "commissioned" ? "pt-16" : "hidden"}>
        {commissioned}
      </div>
    </>
  );
}
