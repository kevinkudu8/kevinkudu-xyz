import { LocalTime } from "@/components/local-time";

export function SiteFooter() {
  return (
    <footer className="px-gutter sticky bottom-0 z-40 flex min-h-5 items-center justify-between gap-4 pt-4 [transform:translateZ(100px)] [text-shadow:0_0_6px_var(--background),0_0_14px_var(--background),0_0_2px_var(--background)] pb-[max(1rem,env(safe-area-inset-bottom))] font-mono text-[0.72rem] tracking-[0.06em] uppercase sm:pt-5 sm:pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:text-[0.8rem]">
      <LocalTime />
      <a
        href="https://x.com/kevkudu"
        target="_blank"
        rel="me noreferrer"
        aria-label="X"
        className="inline-block transition-opacity [filter:drop-shadow(0_0_4px_var(--background))_drop-shadow(0_0_8px_var(--background))] hover:opacity-55"
      >
        <svg width={20} height={20} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M17.53 3H20.5l-6.49 7.41L21.75 21h-5.98l-4.68-6.12L5.7 21H2.73l6.94-7.93L2.25 3h6.13l4.23 5.59L17.53 3Zm-1.04 16.2h1.65L7.6 4.71H5.83L16.49 19.2Z" />
        </svg>
      </a>
    </footer>
  );
}
