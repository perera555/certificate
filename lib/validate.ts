import type {
  Certificate,
  CertificateTemplate,
  OrgSettings,
  PlacedSticker,
  Sticker,
  StickerFinish,
  StickerShape,
} from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */
const str = (v: any, max = 200, fallback = "") => (typeof v === "string" ? v.slice(0, max) : fallback);
const num = (v: any, min: number, max: number, fallback: number) =>
  typeof v === "number" && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback;
const color = (v: any, fallback: string) => (typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v) ? v : fallback);
const oneOf = <T extends string>(v: any, options: readonly T[], fallback: T): T =>
  options.includes(v) ? v : fallback;

const dataImage = (v: any) => {
  const s = str(v, 400_000);
  return /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(s) ? s : "";
};

export const SHAPES = ["rosette", "seal", "shield", "star", "badge", "hologram"] as const satisfies readonly StickerShape[];
export const FINISHES = ["gold", "silver", "bronze", "holo", "flat"] as const satisfies readonly StickerFinish[];
export const TEMPLATES = ["classic", "modern", "elegant", "minimal"] as const satisfies readonly CertificateTemplate[];

export function cleanSticker(input: any): Omit<Sticker, "id" | "createdAt" | "updatedAt"> {
  return {
    name: str(input?.name, 80, "Untitled sticker") || "Untitled sticker",
    shape: oneOf(input?.shape, SHAPES, "rosette"),
    finish: oneOf(input?.finish, FINISHES, "gold"),
    topText: str(input?.topText, 40),
    centerText: str(input?.centerText, 24),
    bottomText: str(input?.bottomText, 40),
    primary: color(input?.primary, "#b8860b"),
    accent: color(input?.accent, "#7a1f1f"),
    textColor: color(input?.textColor, "#3b2a00"),
    ribbons: input?.ribbons !== false,
    image: dataImage(input?.image),
  };
}

function cleanPlaced(input: any): PlacedSticker[] {
  if (!Array.isArray(input)) return [];
  return input.slice(0, 40).map((p: any) => ({
    uid: str(p?.uid, 40) || Math.random().toString(36).slice(2),
    stickerId: str(p?.stickerId, 40),
    x: num(p?.x, 0, 1, 0.5),
    y: num(p?.y, 0, 1, 0.5),
    size: num(p?.size, 0.03, 0.5, 0.14),
    rotation: num(p?.rotation, -180, 180, 0),
  }));
}

export function cleanCertificate(
  input: any
): Omit<Certificate, "id" | "serial" | "createdAt" | "updatedAt"> {
  return {
    template: oneOf(input?.template, TEMPLATES, "classic"),
    title: str(input?.title, 80, "Certificate of Achievement"),
    subtitle: str(input?.subtitle, 120, "This certificate is proudly presented to"),
    recipient: str(input?.recipient, 80),
    description: str(input?.description, 400),
    issueDate: str(input?.issueDate, 20, new Date().toISOString().slice(0, 10)),
    signatoryName: str(input?.signatoryName, 80),
    signatoryTitle: str(input?.signatoryTitle, 80),
    primary: color(input?.primary, "#1e3a5f"),
    accent: color(input?.accent, "#b8860b"),
    placed: cleanPlaced(input?.placed),
    pattern: {
      enabled: !!input?.pattern?.enabled,
      stickerId: str(input?.pattern?.stickerId, 40),
      opacity: num(input?.pattern?.opacity, 0.02, 0.5, 0.08),
      density: num(input?.pattern?.density, 3, 14, 7),
    },
    showQr: input?.showQr !== false,
    status: oneOf(input?.status, ["valid", "revoked"] as const, "valid"),
  };
}

export function cleanSettings(input: any): Omit<OrgSettings, "id" | "updatedAt"> {
  return {
    orgName: str(input?.orgName, 100, "Your Organisation") || "Your Organisation",
    tagline: str(input?.tagline, 140),
    website: str(input?.website, 140),
    logo: dataImage(input?.logo),
  };
}
