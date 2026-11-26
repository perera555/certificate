import type { Sticker, StickerFinish, StickerShape } from "./types";

type StickerLike = Pick<
  Sticker,
  "shape" | "finish" | "topText" | "centerText" | "bottomText" | "primary" | "accent" | "textColor" | "ribbons"
> & { image?: string };

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const FINISH_STOPS: Record<Exclude<StickerFinish, "flat">, string[]> = {
  gold: ["#7a5c12", "#e9c75a", "#fff1a8", "#c9971c", "#f7dc7a", "#8a6a16"],
  silver: ["#5b6270", "#d6dae1", "#ffffff", "#9aa1ad", "#eef0f3", "#646b78"],
  bronze: ["#5a3315", "#c98b4f", "#f3c48e", "#8c5a2b", "#e0a96d", "#5e3718"],
  holo: ["#ff9ad5", "#a8c8ff", "#9dffd9", "#fff59a", "#ffb38a", "#d2a6ff"],
};

/** Viewbox sizes. The badge centre is always at (100, 100). */
export function stickerViewBox(s: Pick<Sticker, "ribbons">) {
  return { w: 200, h: s.ribbons ? 262 : 200 };
}

function starPath(points: number, outer: number, inner: number, cx = 100, cy = 100) {
  const pts: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI * i) / points - Math.PI / 2;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`);
  }
  return `M${pts.join("L")}Z`;
}

function scallopPath(bumps: number, outer: number, inner: number) {
  let d = "";
  for (let i = 0; i < bumps; i++) {
    const a0 = (2 * Math.PI * i) / bumps;
    const a1 = (2 * Math.PI * (i + 1)) / bumps;
    const am = (a0 + a1) / 2;
    const p0 = [100 + inner * Math.cos(a0), 100 + inner * Math.sin(a0)];
    const c = [100 + (outer + 6) * Math.cos(am), 100 + (outer + 6) * Math.sin(am)];
    const p1 = [100 + inner * Math.cos(a1), 100 + inner * Math.sin(a1)];
    d += `${i === 0 ? `M${p0[0].toFixed(2)},${p0[1].toFixed(2)}` : ""}Q${c[0].toFixed(2)},${c[1].toFixed(2)} ${p1[0].toFixed(2)},${p1[1].toFixed(2)}`;
  }
  return d + "Z";
}

const SHIELD = "M100 4 L188 32 V98 C188 154 150 188 100 198 C50 188 12 154 12 98 V32 Z";

function outline(shape: StickerShape) {
  switch (shape) {
    case "rosette":
      return { d: scallopPath(28, 90, 86), band: [82, 60] as const };
    case "seal":
      return { d: starPath(60, 95, 89), band: [82, 60] as const };
    case "shield":
      return { d: SHIELD, band: [78, 58] as const };
    case "star":
      return { d: starPath(12, 97, 80), band: [74, 54] as const };
    case "badge":
      return { d: "M100 6 A94 94 0 1 1 99.99 6 Z", band: [84, 62] as const };
    case "hologram":
      return { d: starPath(90, 95, 91), band: [82, 60] as const };
  }
}

function centerLines(text: string) {
  const lines = text.split(/\||\n/).map((l) => l.trim()).filter(Boolean).slice(0, 2);
  const longest = Math.max(1, ...lines.map((l) => l.length));
  const size = longest <= 4 ? 34 : longest <= 6 ? 28 : longest <= 9 ? 21 : longest <= 12 ? 16 : 13;
  return { lines, size };
}

export function stickerSvg(s: StickerLike): string {
  const finish = s.shape === "hologram" ? "holo" : s.finish;
  const { w, h } = stickerViewBox(s);
  const { d, band } = outline(s.shape);
  const [ro, ri] = band;
  const stops = finish === "flat" ? [s.primary, s.primary] : FINISH_STOPS[finish];
  const grad = stops
    .map((c, i) => `<stop offset="${((i / (stops.length - 1)) * 100).toFixed(1)}%" stop-color="${c}"/>`)
    .join("");
  const ink = s.textColor;
  const accent = s.accent;
  const top = esc(s.topText.toUpperCase());
  const bottom = esc(s.bottomText.toUpperCase());
  const micro = esc(((s.topText || "ORIGINAL") + " • GENUINE • ").toUpperCase().repeat(6));
  const { lines, size } = centerLines(s.centerText || "");
  const rt = ri + 5; // top text baseline (text grows outward)
  const rb = ro - 4; // bottom text baseline (text grows inward)
  const bandText = Math.min(14, (ro - ri) * 0.62);

  const guilloche = Array.from({ length: 24 }, (_, i) => {
    return `<ellipse cx="100" cy="100" rx="${ri - 4}" ry="${(ri - 4) * 0.34}" transform="rotate(${i * 7.5} 100 100)"/>`;
  }).join("");

  const ribbons = s.ribbons
    ? `<g stroke="rgba(0,0,0,.35)" stroke-width="1">
        <path d="M76 140 L110 152 L86 258 L71 240 L52 252 Z" fill="${accent}"/>
        <path d="M124 140 L90 152 L114 258 L129 240 L148 252 Z" fill="${accent}"/>
        <path d="M80 150 L100 156 L84 230 Z" fill="rgba(255,255,255,.18)" stroke="none"/>
        <path d="M120 150 L100 156 L116 230 Z" fill="rgba(0,0,0,.15)" stroke="none"/>
      </g>`
    : "";

  const imgR = ri - 8;
  const centerBlock = s.image
    ? `<circle cx="100" cy="100" r="${imgR + 1}" fill="#fff" fill-opacity=".9"/>
       <image href="${esc(s.image)}" x="${100 - imgR}" y="${100 - imgR}" width="${imgR * 2}" height="${imgR * 2}" preserveAspectRatio="xMidYMid meet" clip-path="url(#inner)"/>`
    : s.shape === "badge"
      ? `<path d="M2 82 H198 L190 100 L198 118 H2 L10 100 Z" fill="${accent}" stroke="rgba(0,0,0,.35)"/>
         <text x="100" y="${100 + Math.min(size, 20) * 0.36}" text-anchor="middle" font-size="${Math.min(size, 20)}" font-weight="800" fill="#fffaf0" letter-spacing="1.5">${esc(lines.join(" "))}</text>`
      : lines
          .map((l, i) => {
            const y = 100 + size * 0.36 + (i - (lines.length - 1) / 2) * size * 1.05;
            return `<text x="100" y="${y.toFixed(1)}" text-anchor="middle" font-size="${size}" font-weight="800" fill="${accent}" letter-spacing="1">${esc(l)}</text>`;
          })
          .join("");

  const starsY = s.shape === "badge" ? [70, 136] : [100 - ri * 0.62, 100 + ri * 0.72];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w * 2}" height="${h * 2}" font-family="Georgia, 'Times New Roman', serif">
  <defs>
    <filter id="sh" x="-10%" y="-10%" width="120%" height="125%"><feDropShadow dx="0" dy="2" stdDeviation="1.5" flood-opacity=".35"/></filter>
    <linearGradient id="f" x1="0" y1="0" x2="1" y2="1">${grad}</linearGradient>
    <radialGradient id="gloss" cx="35%" cy="28%" r="70%">
      <stop offset="0%" stop-color="#fff" stop-opacity=".55"/>
      <stop offset="45%" stop-color="#fff" stop-opacity=".08"/>
      <stop offset="100%" stop-color="#000" stop-opacity=".18"/>
    </radialGradient>
    ${
      finish === "holo"
        ? `<linearGradient id="shine" x1="0" y1="1" x2="1" y2="0">
             <stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".45" stop-color="#fff" stop-opacity=".65"/>
             <stop offset=".55" stop-color="#fff" stop-opacity=".1"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
           </linearGradient>`
        : ""
    }
    <clipPath id="inner"><circle cx="100" cy="100" r="${ri - 2}"/></clipPath>
    <path id="top" d="M${100 - rt} 100 A${rt} ${rt} 0 0 1 ${100 + rt} 100"/>
    <path id="bot" d="M${100 - rb} 100 A${rb} ${rb} 0 0 0 ${100 + rb} 100"/>
    <path id="micro" d="M100 ${100 - (ro + 4)} A${ro + 4} ${ro + 4} 0 1 1 99.99 ${100 - (ro + 4)}"/>
  </defs>
  ${ribbons}
  <path d="${d}" fill="url(#f)" stroke="rgba(0,0,0,.35)" stroke-width="1" filter="url(#sh)"/>
  <path d="${d}" fill="url(#gloss)"/>
  ${finish === "holo" ? `<path d="${d}" fill="url(#shine)"/>` : ""}
  <text font-size="4.2" fill="${ink}" fill-opacity=".75" letter-spacing=".4"><textPath href="#micro" textLength="${(2 * Math.PI * (ro + 4) - 2).toFixed(1)}" lengthAdjust="spacingAndGlyphs">${micro}</textPath></text>
  <circle cx="100" cy="100" r="${ro}" fill="none" stroke="${ink}" stroke-width="1.6"/>
  <circle cx="100" cy="100" r="${ri}" fill="none" stroke="${ink}" stroke-width="1.2"/>
  <circle cx="100" cy="100" r="${ri - 3}" fill="none" stroke="${ink}" stroke-width=".5" stroke-dasharray="1.5 1.5"/>
  <g clip-path="url(#inner)" fill="none" stroke="${accent}" stroke-opacity=".3" stroke-width=".55">${guilloche}</g>
  <text font-size="${bandText.toFixed(1)}" font-weight="700" fill="${ink}" letter-spacing="2"><textPath href="#top" startOffset="50%" text-anchor="middle">${top}</textPath></text>
  <text font-size="${bandText.toFixed(1)}" font-weight="700" fill="${ink}" letter-spacing="2"><textPath href="#bot" startOffset="50%" text-anchor="middle">${bottom}</textPath></text>
  <text x="${100 - ro + (ro - ri) / 2}" y="104" text-anchor="middle" font-size="9" fill="${ink}">★</text>
  <text x="${100 + ro - (ro - ri) / 2}" y="104" text-anchor="middle" font-size="9" fill="${ink}">★</text>
  ${
    s.image
      ? ""
      : `<text x="100" y="${starsY[0].toFixed(1)}" text-anchor="middle" font-size="8" fill="${accent}" letter-spacing="3">★★★</text>
  <text x="100" y="${starsY[1].toFixed(1)}" text-anchor="middle" font-size="8" fill="${accent}" letter-spacing="3">★★★</text>`
  }
  ${centerBlock}
</svg>`;
}

export function stickerDataUrl(s: StickerLike) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(stickerSvg(s))}`;
}

export const STICKER_PRESETS: { label: string; value: StickerLike }[] = [
  {
    label: "Gold rosette",
    value: { shape: "rosette", finish: "gold", topText: "Certified", centerText: "Original", bottomText: "Authentic", primary: "#b8860b", accent: "#7a1f1f", textColor: "#3b2a00", ribbons: true },
  },
  {
    label: "Holographic seal",
    value: { shape: "hologram", finish: "holo", topText: "Genuine document", centerText: "Verified", bottomText: "Security seal", primary: "#9ad0ff", accent: "#4338ca", textColor: "#1e1b4b", ribbons: false },
  },
  {
    label: "Silver seal",
    value: { shape: "seal", finish: "silver", topText: "Official", centerText: "Approved", bottomText: "Quality assured", primary: "#9ca3af", accent: "#1e3a5f", textColor: "#111827", ribbons: false },
  },
  {
    label: "Blue banner badge",
    value: { shape: "badge", finish: "gold", topText: "Excellence", centerText: "Award", bottomText: "Est. 2026", primary: "#b8860b", accent: "#1e3a8a", textColor: "#3b2a00", ribbons: true },
  },
  {
    label: "Bronze shield",
    value: { shape: "shield", finish: "bronze", topText: "Completion", centerText: "Pass", bottomText: "Certified", primary: "#8c5a2b", accent: "#3f1d0b", textColor: "#2b1406", ribbons: false },
  },
  {
    label: "Red star",
    value: { shape: "star", finish: "flat", topText: "Top", centerText: "Best", bottomText: "Student", primary: "#b91c1c", accent: "#fff7ed", textColor: "#fff7ed", ribbons: false },
  },
];
