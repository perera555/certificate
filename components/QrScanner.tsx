"use client";

import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";

function serialFrom(raw: string) {
  const m = raw.match(/\/verify\/([^/?#]+)/);
  return decodeURIComponent(m ? m[1] : raw).trim();
}

function decodeFrom(source: CanvasImageSource, w: number, h: number) {
  const scale = Math.min(1, 1000 / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return jsQR(data.data, data.width, data.height)?.data ?? null;
}

/** Reads a certificate QR code from the camera (or a photo) and returns its serial number. Works on all modern browsers. */
export default function QrScanner({ onSerial }: { onSerial: (serial: string) => void }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!open) return;
    let stream: MediaStream | null = null;
    let raf = 0;
    let stopped = false;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
        const v = video.current;
        if (!v || stopped) return;
        v.srcObject = stream;
        await v.play();
        let last = 0;
        const tick = (t: number) => {
          if (stopped) return;
          if (t - last > 150 && v.videoWidth) {
            last = t;
            const raw = decodeFrom(v, v.videoWidth, v.videoHeight);
            if (raw) {
              setOpen(false);
              onSerial(serialFrom(raw));
              return;
            }
          }
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      } catch {
        setError("Camera not available. Allow camera access, choose a photo, or type the number.");
        setOpen(false);
      }
    })();
    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [open, onSerial]);

  async function fromPhoto(file?: File) {
    if (!file) return;
    setError("");
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      const raw = decodeFrom(img, img.naturalWidth, img.naturalHeight);
      if (raw) onSerial(serialFrom(raw));
      else setError("No QR code found in that photo. Try a closer, sharper picture.");
    } catch {
      setError("Could not read that image.");
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  return (
    <div className="mt-6 space-y-2">
      {!open ? (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className="btn-ghost py-3"
            onClick={() => {
              setError("");
              setOpen(true);
            }}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 8V5a1 1 0 011-1h3M16 4h3a1 1 0 011 1v3M20 16v3a1 1 0 01-1 1h-3M8 20H5a1 1 0 01-1-1v-3" strokeLinecap="round" />
            </svg>
            Scan QR code
          </button>
          <label className="btn-ghost cursor-pointer py-3">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <circle cx="9" cy="11" r="2" />
              <path d="M21 17l-5-5-8 7" strokeLinecap="round" />
            </svg>
            QR from photo
            <input type="file" accept="image/*" className="hidden" onChange={(e) => fromPhoto(e.target.files?.[0])} />
          </label>
        </div>
      ) : (
        <div className="card overflow-hidden p-2">
          <div className="relative">
            <video ref={video} className="aspect-square w-full rounded-xl bg-black object-cover" muted playsInline />
            <div className="pointer-events-none absolute inset-[18%] rounded-2xl border-2 border-amber-300/80 shadow-[0_0_0_999px_rgba(0,0,0,.35)]" />
          </div>
          <p className="mt-2 text-sm text-slate-400">Point the camera at the QR code. It verifies automatically.</p>
          <button type="button" className="btn-ghost mt-2 w-full" onClick={() => setOpen(false)}>Cancel</button>
        </div>
      )}
      {error && <p className="text-sm text-red-300">{error}</p>}
    </div>
  );
}
