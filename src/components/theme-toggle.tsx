"use client";

export function ThemeToggle() {
  function toggle() {
    const root = document.documentElement;
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {}
  }

  // Both icons render; CSS shows the right one, so server and client markup match
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle dark mode"
      title="Toggle dark mode"
      className="grid size-8 shrink-0 place-items-center rounded-[8px] border border-foreground/15 transition-colors hover:border-foreground/40"
    >
      <svg viewBox="0 0 24 24" className="size-4 text-[#4d8a3e] dark:hidden" aria-hidden>
        <circle cx="12" cy="12" r="4" fill="currentColor" />
        <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
            <path key={a} d="M12 2.5v2.6" transform={`rotate(${a} 12 12)`} />
          ))}
        </g>
      </svg>
      <svg viewBox="0 0 24 24" className="hidden size-4 text-[#cfe8b8] dark:block" aria-hidden>
        <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" fill="currentColor" />
      </svg>
    </button>
  );
}
