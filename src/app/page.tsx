import Image from "next/image";
import heroPortrait from "@/assets/hero-portrait.png";

export default function Home() {
  return (
    <main className="px-gutter flex flex-1 items-center py-16 sm:py-24">
      <div className="mx-auto flex w-full max-w-[1526px] flex-col gap-10 sm:flex-row sm:items-center sm:gap-[clamp(2rem,4.9vw,5.875rem)]">
        <div className="aspect-square w-[min(60vw,220px)] shrink-0 overflow-hidden rounded-[clamp(20px,2.5vw,48px)] lg:w-[clamp(220px,22.5vw,431px)]">
          <Image
            src={heroPortrait}
            alt="Portrait of Kevin Kudu"
            placeholder="blur"
            priority
            sizes="(max-width: 640px) 60vw, 22.5vw"
            className="h-full w-full object-cover object-center"
          />
        </div>

        <p className="min-w-0 max-w-[1010px] text-[clamp(1.375rem,2.29vw,2.75rem)] leading-[2.05] tracking-[0.05em]">
          I create <mark>events</mark> 🎪 and <mark>content</mark> 🎥 for tech and
          web3 companies. Currently living in <mark>Seoul</mark> 🇰🇷. I love{" "}
          <mark>consuming</mark> books 📚, movies 🍿 and traveling 🗺️
        </p>
      </div>
    </main>
  );
}
