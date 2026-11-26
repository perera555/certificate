"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import type { Certificate, OrgSettings, Sticker } from "@/lib/types";
import CertificateCanvas from "@/components/CertificateCanvas";
import { downloadPdf } from "@/lib/render-certificate";

type Result = { found: true; certificate: Certificate; stickers: Sticker[]; settings: OrgSettings } | { found: false };

export default function VerifyPage({ params }: PageProps<"/verify/[serial]">) {
  const { serial } = use(params);
  const [res, setRes] = useState<Result | null>(null);

  useEffect(() => {
    fetch(`/api/verify/${encodeURIComponent(decodeURIComponent(serial))}`, { cache: "no-store" })
      .then((r) => r.json())
      .then(setRes)
      .catch(() => setRes({ found: false }));
  }, [serial]);

  const map = useMemo(() => (res?.found ? Object.fromEntries(res.stickers.map((s) => [s.id, s])) : {}), [res]);

  if (!res) return <p className="mx-auto max-w-5xl px-4 py-16 text-center text-slate-400">Checking certificate…</p>;

  if (!res.found)
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-red-500/15 text-4xl text-red-300">✕</div>
        <h1 className="mt-6 text-3xl font-bold">Certificate not found</h1>
        <p className="mt-2 text-slate-400">
          No certificate with number <span className="font-mono text-slate-200">{decodeURIComponent(serial)}</span> exists. It may be
          invalid or not issued through this system.
        </p>
        <Link href="/verify" className="btn-ghost mt-6">Try another number</Link>
      </div>
    );

  const c = res.certificate;
  const valid = c.status === "valid";
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-10">
      <div className={`card flex flex-wrap items-center gap-5 p-6 ${valid ? "border-emerald-500/30" : "border-red-500/30"}`}>
        <div className={`grid h-16 w-16 shrink-0 place-items-center rounded-full text-3xl ${valid ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"}`}>
          {valid ? "✓" : "!"}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold">{valid ? "Genuine certificate" : "This certificate has been revoked"}</h1>
          <p className="text-slate-400">
            Issued by <span className="text-slate-200">{res.settings.orgName}</span> to{" "}
            <span className="text-slate-200">{c.recipient || "—"}</span> on {c.issueDate}
          </p>
          <p className="mt-1 font-mono text-sm text-slate-500">{c.serial}</p>
        </div>
        <button className="btn-gold" onClick={() => downloadPdf({ cert: c, stickers: map, settings: res.settings })}>Download PDF</button>
      </div>
      <CertificateCanvas cert={c} stickers={map} settings={res.settings} />
    </div>
  );
}
