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
        <Link
          href="/"
          className="text-base sm:text-lg lg:text-xl"
        >
          Kevin Kudu
        </Link>

        <ul className="flex items-center gap-5 text-sm sm:gap-10 sm:text-base lg:gap-20 lg:text-lg">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="whitespace-nowrap transition-opacity hover:opacity-55"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
