"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import type { Certificate, Sticker } from "@/lib/types";
import StickerImage from "@/components/StickerImage";

export default function AdminHome() {
  const [stickers, setStickers] = useState<Sticker[] | null>(null);
  const [certs, setCerts] = useState<Certificate[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api<Sticker[]>("/api/stickers"), api<Certificate[]>("/api/certificates")])
      .then(([s, c]) => {
        setStickers(s);
        setCerts(c);
      })
      .catch((e) => setError(e.message));
  }, []);

  const stats = [
    { label: "Stickers", value: stickers?.length ?? "–" },
    { label: "Certificates", value: certs?.length ?? "–" },
    { label: "Valid", value: certs?.filter((c) => c.status === "valid").length ?? "–" },
    { label: "Revoked", value: certs?.filter((c) => c.status === "revoked").length ?? "–" },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-slate-400">Create stickers first, then use them on certificates.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/stickers/new" className="btn-ghost">+ New sticker</Link>
          <Link href="/admin/certificates/new" className="btn-gold">+ New certificate</Link>
        </div>
      </div>

      {error && <p className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-5">
            <div className="text-xs uppercase tracking-wider text-slate-400">{s.label}</div>
            <div className="mt-1 text-3xl font-bold text-amber-200">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Recent stickers</h2>
            <Link href="/admin/stickers" className="text-sm text-amber-300 hover:underline">All stickers →</Link>
          </div>
          {stickers?.length === 0 && <p className="text-sm text-slate-400">No stickers yet. Create your first seal.</p>}
          <div className="grid grid-cols-4 gap-3">
            {stickers?.slice(0, 8).map((s) => (
              <Link key={s.id} href={`/admin/stickers/${s.id}`} className="rounded-xl p-2 transition hover:bg-white/5">
                <StickerImage sticker={s} className="mx-auto w-full max-w-24" />
                <p className="mt-1 truncate text-center text-xs text-slate-400">{s.name}</p>
              </Link>
            ))}
          </div>
        </section>
        <section className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Recent certificates</h2>
            <Link href="/admin/certificates" className="text-sm text-amber-300 hover:underline">All certificates →</Link>
          </div>
          {certs?.length === 0 && <p className="text-sm text-slate-400">No certificates yet.</p>}
          <ul className="divide-y divide-white/5">
            {certs?.slice(0, 6).map((c) => (
              <li key={c.id}>
                <Link href={`/admin/certificates/${c.id}`} className="flex items-center justify-between gap-3 py-2.5 hover:text-amber-200">
                  <span className="truncate">
                    <span className="font-medium">{c.recipient || "Unnamed"}</span>
                    <span className="text-slate-500"> · {c.title}</span>
                  </span>
                  <span className="shrink-0 font-mono text-xs text-slate-500">{c.serial}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
