"use client";

import { useRef, useState } from "react";

/** The email as a big link, plus a copy button for people without a mail app set up. */
export function EmailCta({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  async function copy() {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      window.location.href = `mailto:${email}`;
    }
  }

  return (
    <div className="flex flex-col items-start gap-6">
      <a
        href={`mailto:${email}`}
        className="group relative inline-flex max-w-full items-baseline gap-[0.25em] text-[clamp(1.55rem,6.1vw,6.4rem)] leading-[1.05] tracking-[-0.03em] break-all"
      >
        <span className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_0.06em] bg-left-bottom bg-no-repeat pb-[0.04em] transition-[background-size] duration-500 ease-[cubic-bezier(0.2,0.7,0.2,1)] group-hover:bg-[length:100%_0.06em] group-focus-visible:bg-[length:100%_0.06em] motion-reduce:transition-none">
          {email}
        </span>
        <span
          aria-hidden
          className="text-[0.55em] text-[#ff4f1f] transition-transform duration-500 ease-[cubic-bezier(0.2,0.7,0.2,1)] group-hover:translate-x-[0.12em] group-hover:-translate-y-[0.12em] motion-reduce:transition-none"
        >
          ↗
        </span>
      </a>

      <div className="flex items-center gap-3 font-mono text-[0.65rem] tracking-[0.1em] uppercase">
        <a
          href={`mailto:${email}`}
          className="rounded-full bg-foreground px-5 py-2.5 text-background transition-opacity hover:opacity-85"
        >
          Write to me
        </a>
        <button
          type="button"
          onClick={copy}
          className="rounded-full border border-foreground px-5 py-2.5 tracking-[inherit] uppercase transition-colors hover:bg-foreground/5"
        >
          <span aria-live="polite">{copied ? "Copied ✓" : "Copy email"}</span>
        </button>
      </div>
    </div>
  );
}
