"use client";

import StickerImage from "./StickerImage";
import { STICKER_PRESETS } from "@/lib/sticker-svg";

const POS = [
  "left-[30%] top-[6%] w-[44%] rotate-[-4deg] z-10",
  "left-[0%] top-[44%] w-[34%] rotate-[-14deg]",
  "right-[0%] top-[40%] w-[34%] rotate-[12deg]",
  "left-[8%] top-[0%] w-[22%] rotate-[18deg] opacity-80",
  "right-[6%] top-[2%] w-[24%] rotate-[-10deg] opacity-90",
  "left-[38%] bottom-[0%] w-[24%] rotate-[8deg]",
];

export default function LandingStickers() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-lg">
      <div className="absolute inset-[12%] rounded-full bg-amber-400/10 blur-3xl" />
      {STICKER_PRESETS.map((p, i) => (
        <div key={p.label} className={`absolute drop-shadow-2xl transition hover:scale-105 ${POS[i]}`}>
          <StickerImage sticker={p.value} alt={p.label} className="w-full" />
        </div>
      ))}
    </div>
  );
}
