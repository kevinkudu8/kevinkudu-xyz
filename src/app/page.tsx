import Image from "next/image";
import { HoverWord } from "@/components/hover-word";
import { TiltPortrait } from "@/components/tilt-portrait";
import heroPortrait from "@/assets/hero-portrait.png";
import seoulMap from "@/assets/seoul-map.svg";
// Placeholders cropped from the Figma exports; swap for originals when available
import eventPhoto from "@/assets/placeholders/event-cryptocom-ufc.jpg";
import filmStill1 from "@/assets/placeholders/film-still-1.jpg";
import filmStill2 from "@/assets/placeholders/film-still-2.jpg";
import filmStill3 from "@/assets/placeholders/film-still-3.jpg";

const filmStills = [filmStill1, filmStill2, filmStill3];

const eventsCard = (
  <Image src={eventPhoto} alt="" sizes="20rem" className="block h-auto w-full" />
);

const contentCard = (
  <span className="grid grid-cols-3 gap-0.5 bg-foreground">
    {filmStills.map((still) => (
      <Image
        key={still.src}
        src={still}
        alt=""
        sizes="7rem"
        className="block aspect-[207/263] h-auto w-full object-cover"
      />
    ))}
  </span>
);

const seoulCard = (
  <Image src={seoulMap} alt="" unoptimized className="block h-auto w-full" />
);

const consumingCard = (
  <span className="block bg-[#f9f8e3] font-mono text-[0.7rem] leading-normal tracking-[0.12em] uppercase">
    <span className="flex items-center justify-between border-b border-foreground/15 px-4 py-3">
      <span>📚 Bookshelf</span>
      <span>→</span>
    </span>
    <span className="flex items-center justify-between px-4 py-3">
      <span>🍿 Movie shelf</span>
      <span>→</span>
    </span>
  </span>
);

export default function Home() {
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

        <p className="min-w-0 max-w-[910px] text-[clamp(1.2375rem,2.06vw,2.475rem)] leading-[2.05] tracking-[0.05em]">
          I create{" "}
          <HoverWord href="/events" card={eventsCard}>
            events
          </HoverWord>{" "}
          🎪 and{" "}
          <HoverWord href="/content" card={contentCard}>
            content
          </HoverWord>{" "}
          🎥 for tech and web3 companies. Currently living in{" "}
          <HoverWord card={seoulCard}>Seoul</HoverWord> 🇰🇷. I love{" "}
          <HoverWord href="/my-life" card={consumingCard}>
            consuming
          </HoverWord>{" "}
          books 📚, movies 🍿 and traveling 🗺️
        </p>
      </div>
    </main>
  );
}
