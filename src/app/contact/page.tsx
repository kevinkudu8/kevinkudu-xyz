import type { Metadata } from "next";
import { EmailCta } from "@/components/email-cta";
import { ZoneClock } from "@/components/zone-clock";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with Kevin Kudu about events, content and collaborations.",
};

const EMAIL = "kevinkudukis@gmail.com";

const elsewhere = [
  { label: "X", handle: "@kevkudu", href: "https://x.com/kevkudu" },
  { label: "Letterboxd", handle: "kevinkudu", href: "https://letterboxd.com/kevinkudu/" },
];

export default function ContactPage() {
  return (
    <main className="px-gutter flex flex-1 flex-col justify-center py-16 sm:py-24">
      <p className="font-mono text-[0.7rem] tracking-[0.1em] text-muted uppercase">Contact</p>

      <h1 className="mt-6 max-w-[14ch] text-[clamp(2.2rem,4.6vw,4.4rem)] leading-[1.02] tracking-[-0.025em]">
        Let&apos;s make something worth showing up for.
      </h1>

      <div className="mt-12 sm:mt-16">
        <EmailCta email={EMAIL} />
      </div>

      <dl className="mt-16 grid gap-8 border-t border-foreground/15 pt-8 font-mono text-[0.68rem] tracking-[0.08em] uppercase sm:mt-24 sm:grid-cols-3">
        <div>
          <dt className="text-muted">Based in</dt>
          <dd className="mt-2 flex items-center gap-2.5">
            <span aria-hidden className="relative flex size-2">
              <span className="absolute inset-0 rounded-full bg-[#ff4f1f] motion-safe:animate-[place-pulse_2.6s_ease-out_infinite]" />
              <span className="relative size-2 rounded-full bg-[#ff4f1f]" />
            </span>
            Seoul, South Korea
          </dd>
        </div>
        <div>
          <dt className="text-muted">Local time</dt>
          <dd className="mt-2">
            <ZoneClock timeZone="Asia/Seoul" /> <span className="text-muted">GMT+9</span>
          </dd>
        </div>
        <div>
          <dt className="text-muted">Elsewhere</dt>
          <dd className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
            {elsewhere.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="me noreferrer"
                className="underline decoration-dotted underline-offset-4 transition-opacity hover:opacity-55"
              >
                {link.label} {link.handle}
              </a>
            ))}
          </dd>
        </div>
      </dl>

      <p className="mt-8 max-w-prose text-sm text-muted">
        For events, content, and collaborations. No forms, just email.
      </p>
    </main>
  );
}
