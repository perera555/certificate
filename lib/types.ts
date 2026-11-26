export type StickerShape = "rosette" | "seal" | "shield" | "star" | "badge" | "hologram";
export type StickerFinish = "gold" | "silver" | "bronze" | "holo" | "flat";

export interface Sticker {
  id: string;
  name: string;
  shape: StickerShape;
  finish: StickerFinish;
  topText: string;
  centerText: string;
  bottomText: string;
  primary: string;
  accent: string;
  textColor: string;
  ribbons: boolean;
  /** optional uploaded logo/emblem (data URL) shown in the centre */
  image: string;
  createdAt: string;
  updatedAt: string;
}

export type CertificateTemplate = "classic" | "modern" | "elegant" | "minimal";

export interface PlacedSticker {
  uid: string;
  stickerId: string;
  /** centre position as a fraction (0-1) of the certificate width/height */
  x: number;
  y: number;
  /** diameter as a fraction of the certificate width */
  size: number;
  rotation: number;
}

export interface StickerPattern {
  enabled: boolean;
  stickerId: string;
  opacity: number;
  /** stickers per row */
  density: number;
}

export interface Certificate {
  id: string;
  serial: string;
  template: CertificateTemplate;
  title: string;
  subtitle: string;
  recipient: string;
  description: string;
  issueDate: string;
  signatoryName: string;
  signatoryTitle: string;
  primary: string;
  accent: string;
  placed: PlacedSticker[];
  pattern: StickerPattern;
  showQr: boolean;
  status: "valid" | "revoked";
  createdAt: string;
  updatedAt: string;
}

export interface OrgSettings {
  id: "org";
  orgName: string;
  tagline: string;
  website: string;
  /** small data URL (PNG/JPEG) */
  logo: string;
  updatedAt: string;
}

export const DEFAULT_SETTINGS: OrgSettings = {
  id: "org",
  orgName: "Your Organisation",
  tagline: "",
  website: "",
  logo: "",
  updatedAt: new Date(0).toISOString(),
};
