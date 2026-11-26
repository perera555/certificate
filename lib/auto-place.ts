import type { Certificate, PlacedSticker, Sticker } from "./types";

const uid = () => Math.random().toString(36).slice(2, 10);

/**
 * Put stickers into the sections where certificates normally carry them:
 *  1. main seal  - bottom centre, between the date and the signature
 *  2. corner seal - top-right corner (prefers a holographic sticker)
 *  3. small seal - overlapping the end of the signature line
 */
export function autoPlace(cert: Pick<Certificate, "template">, stickers: Sticker[]): PlacedSticker[] {
  if (stickers.length === 0) return [];
  const holo = stickers.find((s) => s.shape === "hologram" || s.finish === "holo");
  const ribboned = stickers.find((s) => s.ribbons) ?? stickers.find((s) => s !== holo) ?? stickers[0];
  const third = stickers.find((s) => s !== holo && s !== ribboned) ?? holo ?? ribboned;
  const left = cert.template === "modern" ? 330 / 1600 : 0;
  const mid = left + (1 - left) / 2;

  const out: PlacedSticker[] = [
    { uid: uid(), stickerId: ribboned.id, x: mid, y: ribboned.ribbons ? 0.735 : 0.76, size: 0.12, rotation: 0 },
    { uid: uid(), stickerId: (holo ?? third).id, x: 0.9, y: 0.135, size: 0.085, rotation: 12 },
  ];
  if (third && stickers.length > 1) {
    out.push({ uid: uid(), stickerId: third.id, x: left + (1 - left) * 0.73 + 0.11, y: 0.7, size: 0.06, rotation: -10 });
  }
  return out;
}
