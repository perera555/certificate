"use client";

import { useEffect, useState } from "react";
import { api, imageFileToDataUrl } from "@/lib/client";
import { DEFAULT_SETTINGS, type OrgSettings } from "@/lib/types";

export default function SettingsPage() {
  const [s, setS] = useState<OrgSettings>(DEFAULT_SETTINGS);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<OrgSettings>("/api/settings").then(setS).catch((e) => setMsg({ ok: false, text: e.message }));
  }, []);

  async function save() {
    setBusy(true);
    try {
      setS(await api<OrgSettings>("/api/settings", { method: "PUT", json: s }));
      setMsg({ ok: true, text: "Settings saved" });
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-3xl font-bold">Organisation settings</h1>
      <p className="mb-6 text-slate-400">Shown on every certificate and on the verification page.</p>
      <div className="card space-y-5 p-6">
        <div>
          <label className="label">Organisation name</label>
          <input className="input" value={s.orgName} maxLength={100} onChange={(e) => setS({ ...s, orgName: e.target.value })} />
        </div>
        <div>
          <label className="label">Tagline</label>
          <input className="input" value={s.tagline} maxLength={140} onChange={(e) => setS({ ...s, tagline: e.target.value })} />
        </div>
        <div>
          <label className="label">Website</label>
          <input className="input" value={s.website} maxLength={140} onChange={(e) => setS({ ...s, website: e.target.value })} />
        </div>
        <div>
          <label className="label">Logo</label>
          <div className="flex items-center gap-4">
            {s.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.logo} alt="Logo" className="h-16 w-16 rounded-lg bg-white object-contain p-1" />
            ) : (
              <div className="grid h-16 w-16 place-items-center rounded-lg border border-dashed border-white/20 text-xs text-slate-500">None</div>
            )}
            <label className="btn-ghost cursor-pointer">
              Upload logo
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  try {
                    setS({ ...s, logo: await imageFileToDataUrl(f, 600) });
                  } catch (err) {
                    setMsg({ ok: false, text: (err as Error).message });
                  }
                }}
              />
            </label>
            {s.logo && <button className="text-sm text-red-300 hover:underline" onClick={() => setS({ ...s, logo: "" })}>Remove</button>}
          </div>
        </div>
        {msg && <p className={`rounded-lg px-3 py-2 text-sm ${msg.ok ? "bg-emerald-500/10 text-emerald-300" : "bg-red-500/10 text-red-300"}`}>{msg.text}</p>}
        <button className="btn-gold w-full py-2.5" disabled={busy} onClick={save}>{busy ? "Saving…" : "Save settings"}</button>
      </div>
      <div className="card mt-6 p-6 text-sm text-slate-400">
        <h2 className="mb-2 font-semibold text-slate-200">Admin account</h2>
        The admin PIN is set with the <code className="text-amber-200">ADMIN_PIN</code> environment variable (in Vercel: Project →
        Settings → Environment Variables, then redeploy). After 5 wrong PINs, sign-in is locked for 15 minutes.
      </div>
    </div>
  );
}
