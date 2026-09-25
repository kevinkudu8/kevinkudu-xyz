import Link from "next/link";

const links = [
  { href: "/events", label: "Events" },
  { href: "/content", label: "Content" },
  { href: "/my-life", label: "My Life" },
  { href: "/contact", label: "Contact" },
] as const;

export function SiteHeader() {
  return (
    <header className="px-gutter pt-8 sm:pt-12">
      <nav
        aria-label="Main"
        className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
      >
        <Link href="/" className="text-[0.9rem] font-bold tracking-[0.01em] uppercase sm:text-base lg:text-lg">
          Kevin Kudu
        </Link>

        <ul className="-mx-2 flex items-center gap-1 font-mono text-[0.72rem] tracking-[0.06em] uppercase sm:gap-5 sm:text-[0.8rem] lg:gap-10 lg:text-[0.875rem]">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="group/nav relative block px-2 py-1.5 whitespace-nowrap focus-visible:outline-none"
              >
                {link.label}
                {/* Dotted frame with a lime tab, shown on hover and keyboard focus */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 border border-dotted border-foreground opacity-0 group-hover/nav:opacity-100 group-focus-visible/nav:opacity-100"
                />
                <span
                  aria-hidden
                  className="bg-lime pointer-events-none absolute -right-px -bottom-px h-2.5 w-3.5 opacity-0 group-hover/nav:opacity-100 group-focus-visible/nav:opacity-100"
                />
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
