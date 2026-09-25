"use client";

import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void) {
  const id = setInterval(onChange, 1000);
  return () => clearInterval(id);
}

/** Live HH:MM in a fixed time zone (e.g. Kevin's, rather than the visitor's). */
export function ZoneClock({ timeZone }: { timeZone: string }) {
  const time = useSyncExternalStore(
    subscribe,
    () =>
      new Date().toLocaleTimeString("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", hour12: false }),
    () => "--:--",
  );
  return <span className="tabular-nums">{time}</span>;
}
