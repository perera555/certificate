"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/client";

interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedBy: string;
  createdAt: string;
}

const MAX = 4 * 1024 * 1024;
const ACCEPT = ".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx,.txt";

const fmtSize = (n: number) => (n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`);

function icon(type: string) {
  if (type === "application/pdf") return { label: "PDF", cls: "bg-red-500/15 text-red-300" };
  if (type.startsWith("image/")) return { label: "IMG", cls: "bg-sky-500/15 text-sky-300" };
  if (type.includes("word")) return { label: "DOC", cls: "bg-blue-500/15 text-blue-300" };
  if (type.includes("sheet") || type.includes("excel")) return { label: "XLS", cls: "bg-emerald-500/15 text-emerald-300" };
  return { label: "TXT", cls: "bg-slate-500/20 text-slate-300" };
}

export default function DocumentsPanel({ certId }: { certId?: string }) {
  const [items, setItems] = useState<Attachment[] | null>(null);
  const [uploading, setUploading] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const base = `/api/certificates/${certId}/attachments`;

  useEffect(() => {
    if (!certId) return;
    api<Attachment[]>(base).then(setItems).catch((e) => setErrors([e.message]));
  }, [certId, base]);

  async function upload(files: FileList | File[]) {
    if (!certId) return;
    setErrors([]);
    for (const file of Array.from(files)) {
      if (file.size > MAX) {
        setErrors((e) => [...e, `${file.name} is larger than 4 MB`]);
        continue;
      }
      setUploading((u) => [...u, file.name]);
      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch(base, { method: "POST", body: fd });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error ?? `Upload failed (${res.status})`);
        setItems((l) => [...(l ?? []), data]);
      } catch (e) {
        setErrors((x) => [...x, (e as Error).message]);
      } finally {
        setUploading((u) => u.filter((n) => n !== file.name));
      }
    }
    if (input.current) input.current.value = "";
  }

  async function remove(a: Attachment) {
    if (!confirm(`Delete “${a.name}”?`)) return;
    try {
      await api(`${base}/${a.id}`, { method: "DELETE" });
      setItems((l) => l?.filter((x) => x.id !== a.id) ?? null);
    } catch (e) {
      setErrors([(e as Error).message]);
    }
  }

  return (
    <div className="card p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">Documents</h2>
          <p className="text-sm text-slate-400">Supporting files for this certificate (mark sheets, attendance, records). Private to signed-in users.</p>
        </div>
        <button type="button" className="btn-gold" disabled={!certId} onClick={() => input.current?.click()}>
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M12 16V4m0 0l-5 5m5-5l5 5M5 20h14" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Upload documents
        </button>
        <input ref={input} type="file" multiple accept={ACCEPT} className="hidden" onChange={(e) => e.target.files && upload(e.target.files)} />
      </div>

      {!certId ? (
        <p className="rounded-xl border border-dashed border-white/15 p-6 text-center text-sm text-slate-400">
          Save the certificate first, then you can upload documents to it.
        </p>
      ) : (
        <>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setOver(true);
            }}
            onDragLeave={() => setOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setOver(false);
              upload(e.dataTransfer.files);
            }}
            onClick={() => input.current?.click()}
            className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center text-sm transition ${
              over ? "border-amber-400 bg-amber-400/10 text-amber-200" : "border-white/15 text-slate-400 hover:border-white/30"
            }`}
          >
            Drag &amp; drop files here, or click to choose
            <span className="mt-1 block text-xs text-slate-500">PDF, images, Word, Excel or text · up to 4 MB each · 20 files max</span>
          </div>

          {(uploading.length > 0 || errors.length > 0) && (
            <div className="mt-3 space-y-1 text-sm">
              {uploading.map((n) => (
                <p key={n} className="text-amber-200">Uploading {n}…</p>
              ))}
              {errors.map((e, i) => (
                <p key={i} className="text-red-300">{e}</p>
              ))}
            </div>
          )}

          <ul className="mt-4 divide-y divide-white/5">
            {items === null && <li className="py-3 text-sm text-slate-400">Loading…</li>}
            {items?.length === 0 && <li className="py-3 text-sm text-slate-500">No documents yet.</li>}
            {items?.map((a) => {
              const ic = icon(a.type);
              const viewable = a.type === "application/pdf" || a.type.startsWith("image/");
              return (
                <li key={a.id} className="flex flex-wrap items-center gap-3 py-3">
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg text-[11px] font-bold ${ic.cls}`}>{ic.label}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{a.name}</p>
                    <p className="text-xs text-slate-500">
                      {fmtSize(a.size)} · {new Date(a.createdAt).toLocaleString()} · {a.uploadedBy}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {viewable && (
                      <a className="btn-ghost px-3 py-1.5 text-xs" href={`${base}/${a.id}?view`} target="_blank" rel="noreferrer">View</a>
                    )}
                    <a className="btn-ghost px-3 py-1.5 text-xs" href={`${base}/${a.id}`}>Download</a>
                    <button className="btn-danger px-3 py-1.5 text-xs" onClick={() => remove(a)}>Delete</button>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
