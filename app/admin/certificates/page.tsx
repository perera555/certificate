"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/client";
import { downloadPdf } from "@/lib/render-certificate";
import type { Certificate, OrgSettings, Sticker } from "@/lib/types";
import CertificateCanvas from "@/components/CertificateCanvas";

export default function CertificatesPage() {
  const [certs, setCerts] = useState<Certificate[] | null>(null);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [settings, setSettings] = useState<OrgSettings | null>(null);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api<Certificate[]>("/api/certificates"), api<Sticker[]>("/api/stickers"), api<OrgSettings>("/api/settings")])
      .then(([c, s, st]) => {
        setCerts(c);
        setStickers(s);
        setSettings(st);
      })
      .catch((e) => setError(e.message));
  }, []);

  const map = useMemo(() => Object.fromEntries(stickers.map((s) => [s.id, s])), [stickers]);
  const shown = certs?.filter((c) => `${c.recipient} ${c.title} ${c.serial}`.toLowerCase().includes(q.toLowerCase()));

  async function remove(c: Certificate) {
    if (!confirm(`Delete the certificate for ${c.recipient || "this recipient"}?`)) return;
    try {
      await api(`/api/certificates/${c.id}`, { method: "DELETE" });
      setCerts((l) => l?.filter((x) => x.id !== c.id) ?? null);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Certificate Creator</h1>
          <p className="text-slate-400">All certificates you have issued.</p>
        </div>
        <div className="flex gap-2">
          <input className="input w-56" placeholder="Search name, title, serial…" value={q} onChange={(e) => setQ(e.target.value)} />
          <Link href="/admin/certificates/new" className="btn-gold shrink-0">+ New certificate</Link>
        </div>
      </div>
      {error && <p className="mb-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}
      {certs === null && !error && <p className="text-slate-400">Loading…</p>}
      {certs?.length === 0 && (
        <div className="card p-10 text-center">
          <p className="text-slate-300">No certificates yet.</p>
          <Link href="/admin/certificates/new" className="btn-gold mt-4">Create your first certificate</Link>
        </div>
      )}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {settings &&
          shown?.map((c) => (
            <div key={c.id} className="card overflow-hidden">
              <Link href={`/admin/certificates/${c.id}`} className="block bg-black/20 p-3">
                <CertificateCanvas cert={c} stickers={map} settings={settings} />
              </Link>
              <div className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{c.recipient || "Unnamed"}</p>
                    <p className="truncate text-sm text-slate-400">{c.title}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${c.status === "valid" ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"}`}>
                    {c.status}
                  </span>
                </div>
                <p className="font-mono text-xs text-slate-500">{c.serial}</p>
                <div className="flex gap-2">
                  <Link href={`/admin/certificates/${c.id}`} className="btn-ghost flex-1 px-2 py-1.5 text-xs">Edit</Link>
                  <button className="btn-ghost flex-1 px-2 py-1.5 text-xs" onClick={() => downloadPdf({ cert: c, stickers: map, settings })}>PDF</button>
                  <button className="btn-danger flex-1 px-2 py-1.5 text-xs" onClick={() => remove(c)}>Delete</button>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
