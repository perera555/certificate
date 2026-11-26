"use client";

import { useEffect, useRef } from "react";
import { CERT_H, CERT_W, renderCertificate, type RenderInput } from "@/lib/render-certificate";
import type { PlacedSticker } from "@/lib/types";

type Props = RenderInput & {
  className?: string;
  editable?: boolean;
  selected?: string | null;
  onSelect?: (uid: string | null) => void;
  onMove?: (uid: string, x: number, y: number) => void;
  onPlace?: (x: number, y: number) => void;
};

export default function CertificateCanvas({ cert, stickers, settings, className, editable, selected, onSelect, onMove, onPlace }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const token = useRef(0);
  const drag = useRef<{ uid: string; dx: number; dy: number } | null>(null);

  useEffect(() => {
    const t = ++token.current;
    const off = document.createElement("canvas");
    renderCertificate(off, { cert, stickers, settings }, 1)
      .then(() => {
        if (t !== token.current || !ref.current) return;
        const c = ref.current;
        c.width = off.width;
        c.height = off.height;
        c.getContext("2d")!.drawImage(off, 0, 0);
      })
      .catch(console.error);
  }, [cert, stickers, settings]);

  function toFrac(e: React.PointerEvent) {
    const r = ref.current!.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
  }

  function hit(x: number, y: number): PlacedSticker | undefined {
    for (let i = cert.placed.length - 1; i >= 0; i--) {
      const p = cert.placed[i];
      const dx = (x - p.x) * CERT_W;
      const dy = (y - p.y) * CERT_H;
      if (Math.hypot(dx, dy) <= (p.size * CERT_W) / 2) return p;
    }
  }

  function down(e: React.PointerEvent) {
    if (!editable) return;
    const { x, y } = toFrac(e);
    const p = hit(x, y);
    if (p) {
      drag.current = { uid: p.uid, dx: x - p.x, dy: y - p.y };
      (e.target as Element).setPointerCapture(e.pointerId);
      onSelect?.(p.uid);
    } else if (onPlace) {
      onPlace(x, y);
    } else onSelect?.(null);
  }

  function move(e: React.PointerEvent) {
    if (!drag.current) return;
    const { x, y } = toFrac(e);
    onMove?.(drag.current.uid, Math.min(1, Math.max(0, x - drag.current.dx)), Math.min(1, Math.max(0, y - drag.current.dy)));
  }

  const sel = cert.placed.find((p) => p.uid === selected);

  return (
    <div className={`relative ${className ?? ""}`}>
      <canvas
        ref={ref}
        width={CERT_W}
        height={CERT_H}
        className={`block h-auto w-full rounded-lg bg-white shadow-2xl shadow-black/40 ${editable ? "cursor-crosshair touch-none" : ""}`}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
      />
      {editable && sel && (
        <div
          className="pointer-events-none absolute rounded-full border-2 border-dashed border-amber-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.0)]"
          style={{
            left: `${(sel.x - sel.size / 2) * 100}%`,
            top: `${sel.y * 100 - ((sel.size * CERT_W) / CERT_H / 2) * 100}%`,
            width: `${sel.size * 100}%`,
            height: `${((sel.size * CERT_W) / CERT_H) * 100}%`,
          }}
        />
      )}
    </div>
  );
}
