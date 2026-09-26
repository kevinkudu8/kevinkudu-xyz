import Image from "next/image";
import { HoverWord } from "@/components/hover-word";
import { TiltPortrait } from "@/components/tilt-portrait";
import heroPortrait from "@/assets/hero-portrait.png";
import seoulCardImage from "@/assets/card-seoul.jpg";
import eventsCardImage from "@/assets/card-events.jpg";
import contentCardImage from "@/assets/card-content.jpg";
import { getBooks } from "@/lib/books";
import { getFilms } from "@/lib/films";

const previously = [
  { name: "Serotonin", href: "https://serotonin.co" },
  { name: "Push", href: "https://push.xyz" },
  { name: "ETHGlobal", href: "https://ethglobal.com" },
];

const eventsCard = <Image src={eventsCardImage} alt="" fill sizes="20rem" className="object-cover" />;

const contentCard = <Image src={contentCardImage} alt="" fill sizes="20rem" className="object-cover" />;

const seoulCard = <Image src={seoulCardImage} alt="" fill sizes="20rem" className="object-cover" />;

/** Favourite books and five-star films, as covers on a shelf. */
function consumingCard(covers: string[]) {
  return (
    <span className="absolute inset-0 grid grid-cols-4 items-center gap-2.5 bg-[#f1efe6] px-5">
      {covers.map((src, i) => (
        <span
          key={src}
          className="relative aspect-[2/3] w-full overflow-hidden rounded-[2px] shadow-[0_8px_16px_-8px_rgb(0_0_0/0.45)]"
          style={{ transform: `rotate(${[-4, 2, -2, 4][i % 4]}deg)` }}
        >
          <Image src={src} alt="" fill unoptimized className="object-cover" />
        </span>
      ))}
    </span>
  );
}

export default async function Home() {
  const [books, films] = await Promise.all([getBooks(), getFilms()]);
  // Two favourite books and two five-star films, newest first
  const covers = [
    ...books.filter((b) => b.favourite && b.cover && !b.cover.startsWith("/covers/")).slice(0, 2).map((b) => b.cover!),
    ...films.filter((f) => f.rating === 5 && f.poster).slice(0, 2).map((f) => f.poster!),
  ];

  return (
    <main className="px-gutter flex flex-1 items-center overflow-x-clip py-16 sm:py-24">
      <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-10 sm:flex-row sm:items-center sm:gap-[clamp(2rem,4.9vw,5.875rem)]">
        <TiltPortrait className="aspect-square w-[min(54vw,200px)] shrink-0 rounded-[clamp(18px,2.25vw,43px)] lg:w-[clamp(200px,20.25vw,388px)]">
          <Image
            src={heroPortrait}
            alt="Portrait of Kevin Kudu"
            placeholder="blur"
            loading="eager"
            fetchPriority="high"
            sizes="(max-width: 640px) 54vw, 20.25vw"
            className="h-full w-full object-cover object-center"
          />
        </TiltPortrait>

        <div className="min-w-0 max-w-[1000px]">
        <p className="text-[clamp(1.75rem,3.3vw,3.5rem)] leading-[1.12] tracking-[-0.015em]">
          I create{" "}
          <HoverWord href="/events" card={eventsCard}>
            events 🎪
          </HoverWord>{" "}
          and{" "}
          <HoverWord href="/content" card={contentCard}>
            content 🎥
          </HoverWord>{" "}
          for tech and web3 companies. Currently living in{" "}
          <HoverWord card={seoulCard}>Seoul 🇰🇷</HoverWord>. I love{" "}
          <HoverWord href="/my-life" card={consumingCard(covers)}>
            consuming
          </HoverWord>{" "}
          books 📚, movies 🍿 and traveling 🗺️
        </p>
        <p className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[0.68rem] tracking-[0.1em] uppercase sm:mt-10">
          <span className="text-muted">Previously</span>
          {previously.map((company, i) => (
            <span key={company.name} className="flex items-center gap-3">
              {i > 0 && (
                <span aria-hidden className="text-muted">
                  ·
                </span>
              )}
              <a
                href={company.href}
                target="_blank"
                rel="noreferrer"
                className="underline decoration-foreground/25 decoration-dotted underline-offset-4 transition-colors hover:decoration-foreground"
              >
                {company.name}
              </a>
            </span>
          ))}
        </p>
        </div>
      </div>
    </main>
  );
}
