"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import type { Sticker } from "@/lib/types";
import StickerImage from "@/components/StickerImage";

export default function StickersPage() {
  const [items, setItems] = useState<Sticker[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<Sticker[]>("/api/stickers").then(setItems).catch((e) => setError(e.message));
  }, []);

  async function remove(s: Sticker) {
    if (!confirm(`Delete sticker “${s.name}”? Certificates using it will no longer show it.`)) return;
    try {
      await api(`/api/stickers/${s.id}`, { method: "DELETE" });
      setItems((list) => list?.filter((x) => x.id !== s.id) ?? null);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Sticker Creator</h1>
          <p className="text-slate-400">Your organisation&apos;s seals, rosettes and holographic stickers.</p>
        </div>
        <Link href="/admin/stickers/new" className="btn-gold">+ New sticker</Link>
      </div>
      {error && <p className="mb-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}
      {items === null && !error && <p className="text-slate-400">Loading…</p>}
      {items?.length === 0 && (
        <div className="card p-10 text-center">
          <p className="text-slate-300">No stickers yet.</p>
          <Link href="/admin/stickers/new" className="btn-gold mt-4">Create your first sticker</Link>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {items?.map((s) => (
          <div key={s.id} className="card group p-4">
            <Link href={`/admin/stickers/${s.id}`}>
              <StickerImage sticker={s} className="mx-auto w-full max-w-40 transition group-hover:scale-105" />
            </Link>
            <p className="mt-3 truncate text-center font-medium">{s.name}</p>
            <p className="text-center text-xs capitalize text-slate-500">{s.shape} · {s.finish}</p>
            <div className="mt-3 flex gap-2">
              <Link href={`/admin/stickers/${s.id}`} className="btn-ghost flex-1 px-2 py-1.5 text-xs">Edit</Link>
              <button onClick={() => remove(s)} className="btn-danger flex-1 px-2 py-1.5 text-xs">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
