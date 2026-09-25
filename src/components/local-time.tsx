"use client";

import { useSyncExternalStore } from "react";

// e.g. "GMT+9 SEOUL 23:44", from the visitor's own clock and time zone
function read() {
  const now = new Date();
  const offset = -now.getTimezoneOffset();
  const hours = Math.floor(Math.abs(offset) / 60);
  const minutes = Math.abs(offset) % 60;
  const gmt = `GMT${offset < 0 ? "-" : "+"}${hours}${minutes ? `:${String(minutes).padStart(2, "0")}` : ""}`;
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
  const city = zone.split("/").pop()?.replace(/_/g, " ") ?? "";
  const time = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${gmt} ${city} ${time}`.toUpperCase();
}

function subscribe(onChange: () => void) {
  const id = setInterval(onChange, 1000);
  return () => clearInterval(id);
}

export function LocalTime() {
  // Empty on the server; the visitor's time fills in on hydration
  const text = useSyncExternalStore(subscribe, read, () => "");
  return <span className="tabular-nums">{text}</span>;
}
