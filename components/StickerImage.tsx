"use client";

import { useMemo } from "react";
import { stickerDataUrl } from "@/lib/sticker-svg";
import type { Sticker } from "@/lib/types";

type Props = { sticker: Parameters<typeof stickerDataUrl>[0]; className?: string; alt?: string };

export default function StickerImage({ sticker, className, alt }: Props) {
  const src = useMemo(() => stickerDataUrl(sticker), [sticker]);
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt ?? (sticker as Sticker).name ?? "sticker"} className={className} draggable={false} />;
}
