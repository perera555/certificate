"use client";

import QRCode from "qrcode";
import type { Certificate, OrgSettings, Sticker } from "./types";
import { stickerDataUrl, stickerViewBox } from "./sticker-svg";

export const CERT_W = 1600;
export const CERT_H = 1131; // A4 landscape ratio

const imageCache = new Map<string, Promise<HTMLImageElement>>();

export function loadImage(src: string): Promise<HTMLImageElement> {
  let p = imageCache.get(src);
  if (!p) {
    p = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
    imageCache.set(src, p);
    if (imageCache.size > 200) imageCache.delete(imageCache.keys().next().value!);
  }
  return p;
}

const qrCache = new Map<string, Promise<string>>();
function qrDataUrl(text: string, color: string) {
  const key = `${color}|${text}`;
  let p = qrCache.get(key);
  if (!p) {
    p = QRCode.toDataURL(text, { margin: 1, width: 360, errorCorrectionLevel: "M", color: { dark: color, light: "#ffffffff" } });
    qrCache.set(key, p);
  }
  return p;
}

export function verifyUrlFor(serial: string) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/verify/${encodeURIComponent(serial)}`;
}

export interface RenderInput {
  cert: Certificate;
  stickers: Record<string, Sticker>;
  settings: OrgSettings;
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const lines: string[] = [];
  for (const para of text.split("\n")) {
    let line = "";
    for (const word of para.split(/\s+/)) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else line = test;
    }
    lines.push(line);
  }
  return lines;
}

function fitFont(ctx: CanvasRenderingContext2D, text: string, font: (px: number) => string, start: number, maxW: number) {
  let px = start;
  ctx.font = font(px);
  while (px > 14 && ctx.measureText(text).width > maxW) {
    px -= 2;
    ctx.font = font(px);
  }
  return px;
}

function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v + amt * 255)));
  return `rgb(${c(n >> 16)},${c((n >> 8) & 255)},${c(n & 255)})`;
}

function guilloche(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string, alpha: number) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.globalAlpha = alpha;
  ctx.lineWidth = 1;
  for (let i = 0; i < 36; i++) {
    ctx.beginPath();
    ctx.ellipse(cx, cy, r, r * 0.38, (i * Math.PI) / 36, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function corner(ctx: CanvasRenderingContext2D, x: number, y: number, sx: number, sy: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(sx, sy);
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 90);
  ctx.bezierCurveTo(0, 30, 30, 0, 90, 0);
  ctx.moveTo(14, 90);
  ctx.bezierCurveTo(14, 40, 40, 14, 90, 14);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(30, 30, 9, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

async function drawBackground(ctx: CanvasRenderingContext2D, cert: Certificate) {
  const { primary, accent } = cert;
  const W = CERT_W, H = CERT_H;
  switch (cert.template) {
    case "classic": {
      ctx.fillStyle = "#fffdf6";
      ctx.fillRect(0, 0, W, H);
      const g = ctx.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, W * 0.7);
      g.addColorStop(0, "rgba(255,255,255,0)");
      g.addColorStop(1, "rgba(184,134,11,0.10)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      guilloche(ctx, W / 2, H / 2, 420, accent, 0.06);
      ctx.strokeStyle = primary;
      ctx.lineWidth = 14;
      ctx.strokeRect(36, 36, W - 72, H - 72);
      ctx.strokeStyle = accent;
      ctx.lineWidth = 3;
      ctx.strokeRect(62, 62, W - 124, H - 124);
      ctx.lineWidth = 1;
      ctx.strokeRect(72, 72, W - 144, H - 144);
      corner(ctx, 84, 84, 1, 1, accent);
      corner(ctx, W - 84, 84, -1, 1, accent);
      corner(ctx, 84, H - 84, 1, -1, accent);
      corner(ctx, W - 84, H - 84, -1, -1, accent);
      break;
    }
    case "modern": {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = primary;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(340, 0);
      ctx.lineTo(220, H);
      ctx.lineTo(0, H);
      ctx.fill();
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.moveTo(340, 0);
      ctx.lineTo(372, 0);
      ctx.lineTo(252, H);
      ctx.lineTo(220, H);
      ctx.fill();
      ctx.fillStyle = shade(primary, 0.08);
      for (let i = 0; i < 14; i++) {
        ctx.globalAlpha = 0.25;
        ctx.fillRect(0, i * 90, 200 - i * 6, 2);
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = accent;
      ctx.fillRect(W - 300, H - 14, 300, 14);
      ctx.fillStyle = primary;
      ctx.fillRect(W - 600, H - 14, 300, 14);
      break;
    }
    case "elegant": {
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, shade(primary, -0.05));
      g.addColorStop(1, shade(primary, -0.2));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      guilloche(ctx, W / 2, H / 2, 560, accent, 0.08);
      guilloche(ctx, W / 2, H / 2, 300, accent, 0.06);
      ctx.strokeStyle = accent;
      ctx.lineWidth = 4;
      ctx.strokeRect(48, 48, W - 96, H - 96);
      ctx.lineWidth = 1.5;
      ctx.strokeRect(64, 64, W - 128, H - 128);
      corner(ctx, 76, 76, 1, 1, accent);
      corner(ctx, W - 76, 76, -1, 1, accent);
      corner(ctx, 76, H - 76, 1, -1, accent);
      corner(ctx, W - 76, H - 76, -1, -1, accent);
      break;
    }
    case "minimal": {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = accent;
      ctx.fillRect(0, 0, W, 10);
      ctx.fillRect(0, H - 10, W, 10);
      ctx.strokeStyle = "#e5e7eb";
      ctx.lineWidth = 2;
      ctx.strokeRect(40, 40, W - 80, H - 80);
      break;
    }
  }
}

async function drawSticker(
  ctx: CanvasRenderingContext2D,
  sticker: Sticker,
  cx: number,
  cy: number,
  width: number,
  rotation: number
) {
  const img = await loadImage(stickerDataUrl(sticker));
  const vb = stickerViewBox(sticker);
  const h = width * (vb.h / vb.w);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.drawImage(img, -width / 2, -width / 2, width, h);
  ctx.restore();
}

export async function renderCertificate(canvas: HTMLCanvasElement, input: RenderInput, scale = 1) {
  const { cert, stickers, settings } = input;
  canvas.width = CERT_W * scale;
  canvas.height = CERT_H * scale;
  const ctx = canvas.getContext("2d")!;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.imageSmoothingQuality = "high";

  await drawBackground(ctx, cert);

  // "All over" security pattern of a sticker
  const patternSticker = cert.pattern.enabled ? stickers[cert.pattern.stickerId] : undefined;
  if (patternSticker) {
    const cols = cert.pattern.density;
    const step = CERT_W / cols;
    const size = step * 0.55;
    ctx.save();
    ctx.globalAlpha = cert.pattern.opacity;
    for (let row = -1; row * step * 0.8 < CERT_H + step; row++) {
      for (let col = -1; col <= cols; col++) {
        const x = col * step + (row % 2 ? step / 2 : 0) + step / 2;
        const y = row * step * 0.8 + step / 2;
        await drawSticker(ctx, patternSticker, x, y, size, -18);
      }
    }
    ctx.restore();
  }

  const dark = cert.template === "elegant";
  const ink = dark ? "#fdf6e3" : "#1f2937";
  const head = dark ? cert.accent : cert.primary;
  const left = cert.template === "modern" ? 330 : 0;
  const cx = left + (CERT_W - left) / 2;
  const maxW = CERT_W - left - 480;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  let y = 170;
  if (settings.logo) {
    try {
      const logo = await loadImage(settings.logo);
      const ratio = logo.width / logo.height || 1;
      let h = 90;
      let w = h * ratio;
      if (w > 260) {
        w = 260;
        h = w / ratio;
      }
      ctx.drawImage(logo, cx - w / 2, 100 + (90 - h) / 2, w, h);
      y = 230;
    } catch {
      /* ignore broken logo */
    }
  }

  ctx.fillStyle = dark ? cert.accent : cert.accent;
  ctx.font = "600 26px Georgia, serif";
  ctx.letterSpacing = "6px";
  ctx.fillText(settings.orgName.toUpperCase(), cx, y);
  ctx.letterSpacing = "0px";
  if (settings.tagline) {
    ctx.fillStyle = dark ? "rgba(253,246,227,.75)" : "#6b7280";
    ctx.font = "italic 20px Georgia, serif";
    ctx.fillText(settings.tagline, cx, y + 30);
  }

  y += 120;
  ctx.fillStyle = head;
  const titlePx = fitFont(ctx, cert.title.toUpperCase(), (px) => `700 ${px}px Georgia, serif`, 78, maxW);
  ctx.letterSpacing = "4px";
  ctx.fillText(cert.title.toUpperCase(), cx, y);
  ctx.letterSpacing = "0px";
  y += Math.max(40, titlePx * 0.3);

  // ornament line
  ctx.strokeStyle = cert.accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 220, y);
  ctx.lineTo(cx - 20, y);
  ctx.moveTo(cx + 20, y);
  ctx.lineTo(cx + 220, y);
  ctx.stroke();
  ctx.fillStyle = cert.accent;
  ctx.beginPath();
  ctx.moveTo(cx, y - 9);
  ctx.lineTo(cx + 9, y);
  ctx.lineTo(cx, y + 9);
  ctx.lineTo(cx - 9, y);
  ctx.fill();

  y += 70;
  ctx.fillStyle = dark ? "rgba(253,246,227,.85)" : "#4b5563";
  ctx.font = "italic 28px Georgia, serif";
  ctx.fillText(cert.subtitle, cx, y);

  y += 110;
  ctx.fillStyle = dark ? "#ffffff" : cert.primary;
  const name = cert.recipient || "Recipient Name";
  fitFont(ctx, name, (px) => `italic 700 ${px}px "Palatino Linotype", Palatino, Georgia, serif`, 92, maxW);
  ctx.fillText(name, cx, y);
  y += 26;
  ctx.strokeStyle = dark ? cert.accent : "#9ca3af";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - 380, y);
  ctx.lineTo(cx + 380, y);
  ctx.stroke();

  y += 60;
  ctx.fillStyle = ink;
  ctx.font = "26px Georgia, serif";
  for (const line of wrap(ctx, cert.description, Math.min(maxW, 980)).slice(0, 4)) {
    ctx.fillText(line, cx, y);
    y += 38;
  }

  // Signature + date
  const baseY = CERT_H - 190;
  const colL = left + (CERT_W - left) * 0.27;
  const colR = left + (CERT_W - left) * 0.73;
  ctx.strokeStyle = dark ? cert.accent : "#374151";
  ctx.lineWidth = 1.5;
  for (const x of [colL, colR]) {
    ctx.beginPath();
    ctx.moveTo(x - 170, baseY);
    ctx.lineTo(x + 170, baseY);
    ctx.stroke();
  }
  ctx.fillStyle = ink;
  ctx.font = "26px Georgia, serif";
  const dateText = cert.issueDate
    ? new Date(cert.issueDate + "T00:00:00").toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
    : "";
  ctx.fillText(dateText, colL, baseY - 16);
  ctx.font = 'italic 34px "Palatino Linotype", Palatino, Georgia, serif';
  ctx.fillText(cert.signatoryName, colR, baseY - 16);
  ctx.fillStyle = dark ? "rgba(253,246,227,.75)" : "#6b7280";
  ctx.font = "600 18px Georgia, serif";
  ctx.letterSpacing = "3px";
  ctx.fillText("DATE OF ISSUE", colL, baseY + 32);
  ctx.fillText((cert.signatoryTitle || "Authorised signatory").toUpperCase(), colR, baseY + 32);
  ctx.letterSpacing = "0px";

  // Serial + verification
  ctx.font = "16px ui-monospace, Consolas, monospace";
  ctx.fillStyle = dark ? "rgba(253,246,227,.8)" : "#6b7280";
  const verifyUrl = verifyUrlFor(cert.serial);
  ctx.fillText(`Certificate No. ${cert.serial}  ·  Verify at ${verifyUrl.replace(/^https?:\/\//, "")}`, cx, CERT_H - 100);

  if (cert.showQr) {
    const qr = await loadImage(await qrDataUrl(verifyUrl, dark ? "#111827" : cert.primary));
    const s = 130;
    const qx = CERT_W - 110 - s, qy = CERT_H - 110 - s - 20;
    ctx.fillStyle = "#fff";
    ctx.fillRect(qx - 8, qy - 8, s + 16, s + 16);
    ctx.drawImage(qr, qx, qy, s, s);
    ctx.fillStyle = dark ? "rgba(253,246,227,.85)" : "#6b7280";
    ctx.font = "600 13px Georgia, serif";
    ctx.fillText("SCAN TO VERIFY", qx + s / 2, qy + s + 28);
  }

  if (cert.status === "revoked") {
    ctx.save();
    ctx.translate(CERT_W / 2, CERT_H / 2);
    ctx.rotate(-0.35);
    ctx.font = "900 200px Arial, sans-serif";
    ctx.fillStyle = "rgba(220,38,38,.28)";
    ctx.fillText("REVOKED", 0, 70);
    ctx.restore();
  }

  // Placed stickers on top
  for (const p of cert.placed) {
    const s = stickers[p.stickerId];
    if (s) await drawSticker(ctx, s, p.x * CERT_W, p.y * CERT_H, p.size * CERT_W, p.rotation);
  }
}

function fileName(cert: Certificate, ext: string) {
  const base = `${cert.recipient || "certificate"}-${cert.serial}`.replace(/[^a-z0-9-]+/gi, "_");
  return `${base}.${ext}`;
}

function triggerDownload(href: string, name: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export async function downloadPng(input: RenderInput) {
  const canvas = document.createElement("canvas");
  await renderCertificate(canvas, input, 2);
  const blob: Blob = await new Promise((r) => canvas.toBlob((b) => r(b!), "image/png"));
  const url = URL.createObjectURL(blob);
  triggerDownload(url, fileName(input.cert, "png"));
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export async function downloadPdf(input: RenderInput) {
  const { jsPDF } = await import("jspdf");
  const canvas = document.createElement("canvas");
  await renderCertificate(canvas, input, 2);
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4", compress: true });
  pdf.setProperties({
    title: `${input.cert.title} — ${input.cert.recipient}`,
    subject: `Certificate ${input.cert.serial}`,
    creator: input.settings.orgName,
  });
  pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, 297, 210, undefined, "FAST");
  pdf.save(fileName(input.cert, "pdf"));
}
