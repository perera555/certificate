"use client";

import { use, useEffect, useState } from "react";
import { api } from "@/lib/client";
import type { Sticker } from "@/lib/types";
import StickerEditor from "@/components/StickerEditor";

export default function EditStickerPage({ params }: PageProps<"/admin/stickers/[id]">) {
  const { id } = use(params);
  const [sticker, setSticker] = useState<Sticker | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<Sticker>(`/api/stickers/${id}`).then(setSticker).catch((e) => setError(e.message));
  }, [id]);

  if (error) return <p className="mx-auto max-w-7xl px-4 py-8 text-red-300">{error}</p>;
  if (!sticker) return <p className="mx-auto max-w-7xl px-4 py-8 text-slate-400">Loading…</p>;
  return <StickerEditor key={sticker.id} initial={{ ...sticker, image: sticker.image ?? "" }} />;
}
