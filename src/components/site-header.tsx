import Link from "next/link";
import type { ReactNode } from "react";

const links = [
  { href: "/events", label: "Events" },
  { href: "/content", label: "Content" },
  { href: "/my-life", label: "My Life" },
  { href: "/contact", label: "Contact" },
] as const;

// Dotted frame, shown on hover and keyboard focus
function Frame() {
  return (
    <span
      aria-hidden
      className="dotted-frame pointer-events-none absolute inset-0 opacity-0 group-hover/nav:opacity-100 group-focus-visible/nav:opacity-100"
    />
  );
}

function HeaderLink({ href, className, children }: { href: "/" | (typeof links)[number]["href"]; className: string; children: ReactNode }) {
  return (
    <Link href={href} className={`group/nav relative block whitespace-nowrap focus-visible:outline-none ${className}`}>
      {children}
      <Frame />
    </Link>
  );
}

export function SiteHeader() {
  return (
    <header className="px-gutter pt-8 sm:pt-12">
      <nav
        aria-label="Main"
        className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
      >
        <HeaderLink
          href="/"
          className="-mx-3 -my-2 px-3 py-2 text-[0.9rem] font-bold tracking-[0.01em] uppercase sm:text-base lg:text-lg"
        >
          Kevin Kudu
        </HeaderLink>

        <ul className="-mx-3 flex items-center gap-0 font-mono text-[0.72rem] tracking-[0.06em] uppercase sm:gap-3 sm:text-[0.8rem] lg:gap-8 lg:text-[0.875rem]">
          {links.map((link) => (
            <li key={link.href}>
              <HeaderLink href={link.href} className="px-3 py-2">
                {link.label}
              </HeaderLink>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
