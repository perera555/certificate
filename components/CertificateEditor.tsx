"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/client";
import { autoPlace } from "@/lib/auto-place";
import { downloadPdf, downloadPng } from "@/lib/render-certificate";
import { DEFAULT_SETTINGS, type Certificate, type OrgSettings, type Sticker } from "@/lib/types";
import { TEMPLATES } from "@/lib/validate";
import CertificateCanvas from "./CertificateCanvas";
import StickerImage from "./StickerImage";
import DocumentsPanel from "./DocumentsPanel";

type Draft = Omit<Certificate, "id" | "serial" | "createdAt" | "updatedAt">;

const TEMPLATE_COLORS: Record<Draft["template"], { primary: string; accent: string }> = {
  classic: { primary: "#1e3a5f", accent: "#b8860b" },
  modern: { primary: "#0f766e", accent: "#f59e0b" },
  elegant: { primary: "#14213d", accent: "#d4af37" },
  minimal: { primary: "#111827", accent: "#2563eb" },
};

const blank: Draft = {
  template: "classic",
  title: "Certificate of Achievement",
  subtitle: "This certificate is proudly presented to",
  recipient: "",
  description: "for outstanding performance and successful completion of the programme.",
  issueDate: new Date().toISOString().slice(0, 10),
  signatoryName: "",
  signatoryTitle: "Director",
  primary: "#1e3a5f",
  accent: "#b8860b",
  placed: [],
  pattern: { enabled: true, stickerId: "", opacity: 0.07, density: 7 },
  showQr: true,
  status: "valid",
};

export default function CertificateEditor({ initial }: { initial?: Certificate }) {
  const router = useRouter();
  const [d, setD] = useState<Draft>(initial ?? blank);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [settings, setSettings] = useState<OrgSettings>(DEFAULT_SETTINGS);
  const [selected, setSelected] = useState<string | null>(null);
  const [armed, setArmed] = useState<string | null>(null);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    Promise.all([api<Sticker[]>("/api/stickers"), api<OrgSettings>("/api/settings")])
      .then(([s, st]) => {
        setStickers(s);
        setSettings(st);
        if (!initial && s.length) {
          const holo = s.find((x) => x.shape === "hologram" || x.finish === "holo") ?? s[0];
          setD((p) => ({ ...p, placed: autoPlace(p, s), pattern: { ...p.pattern, stickerId: holo.id } }));
        }
      })
      .catch((e) => setMsg({ ok: false, text: e.message }));
  }, [initial]);

  const stickerMap = useMemo(() => Object.fromEntries(stickers.map((s) => [s.id, s])), [stickers]);
  const preview: Certificate = useMemo(
    () => ({
      ...d,
      id: initial?.id ?? "preview",
      serial: initial?.serial ?? "OC-PREVIEW-0000",
      createdAt: initial?.createdAt ?? "",
      updatedAt: initial?.updatedAt ?? "",
    }),
    [d, initial]
  );
  const sel = d.placed.find((p) => p.uid === selected);

  function updatePlaced(uid: string, patch: Partial<Draft["placed"][number]>) {
    setD((p) => ({ ...p, placed: p.placed.map((x) => (x.uid === uid ? { ...x, ...patch } : x)) }));
  }

  function place(x: number, y: number) {
    if (!armed) return setSelected(null);
    const uid = Math.random().toString(36).slice(2, 10);
    setD((p) => ({ ...p, placed: [...p.placed, { uid, stickerId: armed, x, y, size: 0.11, rotation: 0 }] }));
    setSelected(uid);
    setArmed(null);
  }

  async function save() {
    setBusy("save");
    setMsg(null);
    try {
      if (initial) {
        await api(`/api/certificates/${initial.id}`, { method: "PUT", json: d });
        setMsg({ ok: true, text: "Certificate updated" });
        router.refresh();
      } else {
        const c = await api<Certificate>("/api/certificates", { method: "POST", json: d });
        router.replace(`/admin/certificates/${c.id}`);
      }
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    } finally {
      setBusy("");
    }
  }

  async function remove() {
    if (!initial || !confirm("Delete this certificate permanently? Its verification link will stop working.")) return;
    setBusy("delete");
    try {
      await api(`/api/certificates/${initial.id}`, { method: "DELETE" });
      router.push("/admin/certificates");
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
      setBusy("");
    }
  }

  async function download(kind: "pdf" | "png") {
    setBusy(kind);
    try {
      const input = { cert: preview, stickers: stickerMap, settings };
      await (kind === "pdf" ? downloadPdf(input) : downloadPng(input));
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="mx-auto grid max-w-[1500px] gap-6 px-4 py-6 xl:grid-cols-[1fr_400px]">
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{initial ? "Edit certificate" : "Create certificate"}</h1>
            <p className="text-sm text-slate-400">
              {initial ? <span className="font-mono">{initial.serial}</span> : "A serial number and QR code are added when you save."}
              {initial && (
                <>
                  {" · "}
                  <Link className="text-amber-300 hover:underline" href={`/verify/${initial.serial}`} target="_blank">
                    Verification page ↗
                  </Link>
                </>
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn-ghost" disabled={!initial || !!busy} onClick={() => download("png")} title={initial ? "" : "Save first"}>
              {busy === "png" ? "Preparing…" : "PNG"}
            </button>
            <button className="btn-gold" disabled={!initial || !!busy} onClick={() => download("pdf")} title={initial ? "" : "Save first"}>
              {busy === "pdf" ? "Preparing…" : "Download PDF"}
            </button>
          </div>
        </div>

        <CertificateCanvas
          cert={preview}
          stickers={stickerMap}
          settings={settings}
          editable
          selected={selected}
          onSelect={setSelected}
          onMove={(uid, x, y) => updatePlaced(uid, { x, y })}
          onPlace={place}
        />

        <div className="card p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-slate-300">
              {armed ? (
                <span className="text-amber-300">Click on the certificate where the sticker should go.</span>
              ) : (
                "Pick a sticker, then click the certificate to place it. Drag placed stickers to move them."
              )}
            </p>
            <div className="flex gap-2">
              <button
                className="btn-gold px-3 py-1.5 text-xs"
                disabled={!stickers.length}
                onClick={() => {
                  setD((p) => ({ ...p, placed: autoPlace(p, stickers) }));
                  setSelected(null);
                }}
              >
                ✨ Auto-place stickers
              </button>
              <button className="btn-ghost px-3 py-1.5 text-xs" onClick={() => set("placed", [])}>Clear</button>
            </div>
          </div>
          {stickers.length === 0 ? (
            <p className="text-sm text-slate-400">
              You have no stickers yet. <Link href="/admin/stickers/new" className="text-amber-300 hover:underline">Create one in the Sticker Creator →</Link>
            </p>
          ) : (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {stickers.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setArmed(armed === s.id ? null : s.id)}
                  className={`shrink-0 rounded-xl border p-2 transition ${armed === s.id ? "border-amber-400 bg-amber-400/10" : "border-white/10 hover:bg-white/5"}`}
                  title={s.name}
                >
                  <StickerImage sticker={s} className="h-16 w-16 object-contain" />
                </button>
              ))}
            </div>
          )}
          {sel && (
            <div className="mt-4 grid items-end gap-4 border-t border-white/10 pt-4 sm:grid-cols-[1fr_1fr_auto]">
              <div>
                <label className="label">Size</label>
                <input type="range" min={0.03} max={0.35} step={0.005} value={sel.size} onChange={(e) => updatePlaced(sel.uid, { size: +e.target.value })} className="w-full" />
              </div>
              <div>
                <label className="label">Rotation ({Math.round(sel.rotation)}°)</label>
                <input type="range" min={-180} max={180} value={sel.rotation} onChange={(e) => updatePlaced(sel.uid, { rotation: +e.target.value })} className="w-full" />
              </div>
              <button
                className="btn-danger"
                onClick={() => {
                  set("placed", d.placed.filter((p) => p.uid !== sel.uid));
                  setSelected(null);
                }}
              >
                Remove sticker
              </button>
            </div>
          )}
        </div>

        <DocumentsPanel certId={initial?.id} />
      </section>

      <aside className="card h-fit space-y-4 p-5 xl:sticky xl:top-28">
        <div>
          <label className="label">Template</label>
          <div className="grid grid-cols-4 gap-2">
            {TEMPLATES.map((t) => (
              <button
                key={t}
                onClick={() => setD((p) => ({ ...p, template: t, ...TEMPLATE_COLORS[t] }))}
                className={`rounded-lg border px-2 py-2 text-xs capitalize ${d.template === t ? "border-amber-400 bg-amber-400/10 text-amber-200" : "border-white/10 text-slate-300 hover:bg-white/5"}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Main colour</label>
            <input type="color" className="swatch" value={d.primary} onChange={(e) => set("primary", e.target.value)} />
          </div>
          <div>
            <label className="label">Accent colour</label>
            <input type="color" className="swatch" value={d.accent} onChange={(e) => set("accent", e.target.value)} />
          </div>
        </div>
        <Field label="Title" value={d.title} onChange={(v) => set("title", v)} max={80} />
        <Field label="Subtitle" value={d.subtitle} onChange={(v) => set("subtitle", v)} max={120} />
        <Field label="Recipient name" value={d.recipient} onChange={(v) => set("recipient", v)} max={80} placeholder="Full name" />
        <div>
          <label className="label">Description</label>
          <textarea className="input min-h-20" maxLength={400} value={d.description} onChange={(e) => set("description", e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Issue date</label>
            <input type="date" className="input" value={d.issueDate} onChange={(e) => set("issueDate", e.target.value)} />
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={d.status} onChange={(e) => set("status", e.target.value as Draft["status"])}>
              <option value="valid">Valid</option>
              <option value="revoked">Revoked</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Signatory" value={d.signatoryName} onChange={(v) => set("signatoryName", v)} max={80} />
          <Field label="Signatory title" value={d.signatoryTitle} onChange={(v) => set("signatoryTitle", v)} max={80} />
        </div>

        <div className="space-y-3 rounded-xl border border-white/10 p-3">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" className="h-4 w-4 accent-amber-400" checked={d.pattern.enabled} onChange={(e) => set("pattern", { ...d.pattern, enabled: e.target.checked })} />
            Sticker security pattern all over
          </label>
          {d.pattern.enabled && (
            <>
              <select className="input" value={d.pattern.stickerId} onChange={(e) => set("pattern", { ...d.pattern, stickerId: e.target.value })}>
                <option value="">Choose a sticker…</option>
                {stickers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Strength</label>
                  <input type="range" min={0.02} max={0.3} step={0.01} value={d.pattern.opacity} onChange={(e) => set("pattern", { ...d.pattern, opacity: +e.target.value })} className="w-full" />
                </div>
                <div>
                  <label className="label">Density</label>
                  <input type="range" min={3} max={14} value={d.pattern.density} onChange={(e) => set("pattern", { ...d.pattern, density: +e.target.value })} className="w-full" />
                </div>
              </div>
            </>
          )}
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="h-4 w-4 accent-amber-400" checked={d.showQr} onChange={(e) => set("showQr", e.target.checked)} />
            Verification QR code
          </label>
        </div>

        {msg && <p className={`rounded-lg px-3 py-2 text-sm ${msg.ok ? "bg-emerald-500/10 text-emerald-300" : "bg-red-500/10 text-red-300"}`}>{msg.text}</p>}

        <div className="flex gap-2 border-t border-white/10 pt-4">
          <button className="btn-gold flex-1 py-2.5" disabled={!!busy} onClick={save}>
            {busy === "save" ? "Saving…" : initial ? "Update certificate" : "Save certificate"}
          </button>
          {initial && <button className="btn-danger" disabled={!!busy} onClick={remove}>Delete</button>}
        </div>
      </aside>
    </div>
  );
}

function Field({ label, value, onChange, max, placeholder }: { label: string; value: string; onChange: (v: string) => void; max: number; placeholder?: string }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input className="input" value={value} maxLength={max} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
