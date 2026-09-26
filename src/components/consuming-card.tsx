import Image from "next/image";
import parasite from "@/assets/parasite.jpg";
import stoner from "@/assets/stoner.jpg";

const mono = "font-mono uppercase leading-none";

// Barcode-ish stripes
const Bars = ({ className }: { className?: string }) => (
  <span
    aria-hidden
    className={`block h-[9px] ${className ?? ""}`}
    style={{ background: "repeating-linear-gradient(90deg,#111 0 1px,transparent 1px 2px,#111 2px 4px,transparent 4px 5px,#111 5px 6px,transparent 6px 8px)" }}
  />
);

/** A flat-lay of things consumed: a book, a film, a boarding pass and a run badge, piled up. */
export function ConsumingCard() {
  return (
    <span className="absolute inset-0 overflow-hidden bg-[#f4f3ef]">
      {/* Stoner, underneath */}
      <span className="absolute top-[12%] left-[29%] z-10 w-[22%] rotate-[-14deg] shadow-[0_6px_12px_-5px_rgb(0_0_0/0.45)]">
        <Image src={stoner} alt="" sizes="5rem" className="block h-auto w-full" />
      </span>

      {/* Parasite poster */}
      <span className="absolute top-[10%] left-[45%] z-20 w-[22%] rotate-[11deg] shadow-[0_6px_12px_-5px_rgb(0_0_0/0.45)]">
        <Image src={parasite} alt="" sizes="5rem" className="block h-auto w-full" />
      </span>

      {/* Boarding pass */}
      <span className="absolute top-[47%] left-[12%] z-30 w-[42%] rotate-[-8deg] rounded-[4px] bg-white p-[5px] shadow-[0_5px_12px_-4px_rgb(0_0_0/0.4)]">
        <span className={`${mono} flex items-center justify-between text-[5px] text-muted`}>
          <span>From</span>
          <span>✈</span>
          <span>To</span>
        </span>
        <span className={`${mono} mt-[3px] flex items-center justify-between text-[13px] font-bold tracking-[-0.02em] text-foreground`}>
          <span>ICN</span>
          <span>YYZ</span>
        </span>
        <span className={`${mono} mt-[2px] flex justify-between text-[4.5px] text-muted`}>
          <span>Seoul</span>
          <span>Toronto</span>
        </span>
        <span className={`${mono} mt-[4px] grid grid-cols-3 gap-[2px] rounded-[2px] bg-[#a8bfe0] p-[3px] text-[4.5px] text-foreground`}>
          <span>Gate<br />C21</span>
          <span>Seat<br />15C</span>
          <span>Flight<br />KE073</span>
        </span>
        <Bars className="mt-[4px]" />
      </span>

      {/* Run badge */}
      <span className="absolute top-[53%] left-[46%] z-40 flex w-[33%] rotate-[5deg] flex-col rounded-[5px] bg-[#a79dfe] p-[6px] shadow-[0_6px_14px_-4px_rgb(0_0_0/0.45)]">
        <span className={`${mono} text-[5px] text-foreground/70`}>Purple level</span>
        <span className="mt-[3px] text-[15px] leading-none font-black tracking-[-0.03em] text-foreground italic">4,289</span>
        <span className={`${mono} mt-[2px] text-[5px] text-foreground`}>Total km</span>
        <span className="mt-[4px] block h-[2px] rounded-full bg-foreground/20">
          <span className="block h-full w-[72%] rounded-full bg-foreground" />
        </span>
      </span>
    </span>
  );
}
