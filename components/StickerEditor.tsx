"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, imageFileToDataUrl } from "@/lib/client";
import { STICKER_PRESETS, stickerDataUrl, stickerSvg, stickerViewBox } from "@/lib/sticker-svg";
import type { Sticker } from "@/lib/types";
import { FINISHES, SHAPES } from "@/lib/validate";
import StickerImage from "./StickerImage";

type Draft = Omit<Sticker, "id" | "createdAt" | "updatedAt">;

const blank: Draft = { name: "Gold rosette", image: "", ...STICKER_PRESETS[0].value };

export default function StickerEditor({ initial }: { initial?: Sticker }) {
  const router = useRouter();
  const [d, setD] = useState<Draft>(initial ?? blank);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((p) => ({ ...p, [k]: v }));

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      if (initial) {
        await api(`/api/stickers/${initial.id}`, { method: "PUT", json: d });
        setMsg({ ok: true, text: "Sticker updated" });
      } else {
        const s = await api<Sticker>("/api/stickers", { method: "POST", json: d });
        router.replace(`/admin/stickers/${s.id}`);
        setMsg({ ok: true, text: "Sticker saved" });
      }
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!initial || !confirm(`Delete “${d.name}”?`)) return;
    setBusy(true);
    try {
      await api(`/api/stickers/${initial.id}`, { method: "DELETE" });
      router.push("/admin/stickers");
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
      setBusy(false);
    }
  }

  async function upload(file?: File) {
    if (!file) return;
    try {
      set("image", await imageFileToDataUrl(file, 400));
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    }
  }

  function downloadSvg() {
    const blob = new Blob([stickerSvg(d)], { type: "image/svg+xml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${d.name.replace(/[^a-z0-9]+/gi, "_")}.svg`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 3000);
  }

  async function downloadPng() {
    const vb = stickerViewBox(d);
    const img = new Image();
    img.src = stickerDataUrl(d);
    await img.decode();
    const c = document.createElement("canvas");
    c.width = vb.w * 6;
    c.height = vb.h * 6;
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    const a = document.createElement("a");
    a.href = c.toDataURL("image/png");
    a.download = `${d.name.replace(/[^a-z0-9]+/gi, "_")}.png`;
    a.click();
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[1fr_420px]">
      <section className="card flex flex-col items-center justify-center gap-6 p-6 lg:sticky lg:top-28 lg:self-start">
        <div className="relative flex w-full items-center justify-center rounded-xl bg-[repeating-conic-gradient(#ffffff08_0_25%,transparent_0_50%)] bg-[length:24px_24px] p-8">
          <StickerImage sticker={d} className="w-full max-w-sm drop-shadow-2xl" />
        </div>
        <div className="w-full">
          <p className="label">Quick styles</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {STICKER_PRESETS.map((p) => (
              <button
                key={p.label}
                title={p.label}
                onClick={() => setD((prev) => ({ ...prev, ...p.value, image: prev.image }))}
                className="rounded-xl border border-white/10 p-2 hover:border-amber-400/60 hover:bg-white/5"
              >
                <StickerImage sticker={p.value} className="mx-auto w-14" />
                <span className="mt-1 block truncate text-[10px] text-slate-400">{p.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="card space-y-5 p-6">
        <h1 className="text-2xl font-bold">{initial ? "Edit sticker" : "Create sticker"}</h1>
        <div>
          <label className="label">Sticker name</label>
          <input className="input" value={d.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Shape</label>
            <select className="input capitalize" value={d.shape} onChange={(e) => set("shape", e.target.value as Draft["shape"])}>
              {SHAPES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Finish</label>
            <select className="input capitalize" value={d.finish} onChange={(e) => set("finish", e.target.value as Draft["finish"])}>
              {FINISHES.map((s) => <option key={s} value={s}>{s === "holo" ? "holographic" : s}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Top text (around the ring)</label>
          <input className="input" maxLength={40} value={d.topText} onChange={(e) => set("topText", e.target.value)} />
        </div>
        <div>
          <label className="label">Centre text (use | for two lines)</label>
          <input className="input" maxLength={24} value={d.centerText} onChange={(e) => set("centerText", e.target.value)} disabled={!!d.image} />
        </div>
        <div>
          <label className="label">Bottom text (around the ring)</label>
          <input className="input" maxLength={40} value={d.bottomText} onChange={(e) => set("bottomText", e.target.value)} />
        </div>

        <div>
          <label className="label">Centre logo / emblem (optional)</label>
          <div className="flex items-center gap-3">
            <label className="btn-ghost cursor-pointer">
              Upload image
              <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
            </label>
            {d.image && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={d.image} alt="" className="h-10 w-10 rounded-full bg-white object-contain" />
                <button className="text-sm text-red-300 hover:underline" onClick={() => set("image", "")}>Remove</button>
              </>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-500">Use your own organisation&apos;s logo only.</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="label">Base</label>
            <input type="color" className="swatch" value={d.primary} onChange={(e) => set("primary", e.target.value)} />
          </div>
          <div>
            <label className="label">Accent</label>
            <input type="color" className="swatch" value={d.accent} onChange={(e) => set("accent", e.target.value)} />
          </div>
          <div>
            <label className="label">Text</label>
            <input type="color" className="swatch" value={d.textColor} onChange={(e) => set("textColor", e.target.value)} />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={d.ribbons} onChange={(e) => set("ribbons", e.target.checked)} className="h-4 w-4 accent-amber-400" />
          Ribbon tails
        </label>

        {msg && (
          <p className={`rounded-lg px-3 py-2 text-sm ${msg.ok ? "bg-emerald-500/10 text-emerald-300" : "bg-red-500/10 text-red-300"}`}>{msg.text}</p>
        )}

        <div className="flex flex-wrap gap-2 border-t border-white/10 pt-5">
          <button onClick={save} disabled={busy} className="btn-gold flex-1">{initial ? "Update sticker" : "Save sticker"}</button>
          {initial && <button onClick={remove} disabled={busy} className="btn-danger">Delete</button>}
        </div>
        <div className="flex gap-2">
          <button onClick={downloadPng} className="btn-ghost flex-1">Download PNG</button>
          <button onClick={downloadSvg} className="btn-ghost flex-1">Download SVG</button>
        </div>
      </section>
    </div>
  );
}
