const socials = [
  { href: "https://instagram.com/", label: "Instagram", icon: "instagram" },
  { href: "https://x.com/", label: "X", icon: "x" },
  { href: "https://letterboxd.com/", label: "Letterboxd", icon: "letterboxd" },
] as const;

function Icon({ name }: { name: (typeof socials)[number]["icon"] }) {
  const common = { width: 20, height: 20, "aria-hidden": true } as const;

  if (name === "instagram") {
    return (
      <svg {...common} viewBox="0 0 24 24" fill="none">
        <rect
          x="2.5"
          y="2.5"
          width="19"
          height="19"
          rx="5.5"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <circle cx="12" cy="12" r="4.4" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="17.6" cy="6.4" r="1.25" fill="currentColor" />
      </svg>
    );
  }

  if (name === "x") {
    return (
      <svg {...common} viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.53 3H20.5l-6.49 7.41L21.75 21h-5.98l-4.68-6.12L5.7 21H2.73l6.94-7.93L2.25 3h6.13l4.23 5.59L17.53 3Zm-1.04 16.2h1.65L7.6 4.71H5.83L16.49 19.2Z" />
      </svg>
    );
  }

  // Letterboxd: three overlapping dots on a dark disc
  return (
    <svg {...common} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" fill="currentColor" />
      <circle cx="7.4" cy="12" r="2.9" fill="var(--background)" />
      <circle cx="12" cy="12" r="2.9" fill="var(--background)" />
      <circle cx="16.6" cy="12" r="2.9" fill="var(--background)" />
    </svg>
  );
}

export function SiteFooter() {
  return (
    <footer className="px-gutter pb-10 sm:pb-16">
      <ul className="flex items-center gap-3">
        {socials.map((social) => (
          <li key={social.label}>
            <a
              href={social.href}
              target="_blank"
              rel="me noreferrer"
              aria-label={social.label}
              className="block transition-opacity hover:opacity-55"
            >
              <Icon name={social.icon} />
            </a>
          </li>
        ))}
      </ul>
    </footer>
  );
}
