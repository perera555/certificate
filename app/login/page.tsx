"use client";

import { useCallback, useEffect, useState } from "react";

const LENGTH = 4;
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];

export default function LoginPage() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(false);
  const [dest, setDest] = useState("");

  useEffect(() => {
    const next = new URLSearchParams(window.location.search).get("next") ?? "";
    if (next.startsWith("/admin/stickers")) setDest("Sticker Creator");
    else if (next.startsWith("/admin/certificates")) setDest("Certificate Creator");
    else if (next.startsWith("/admin/settings")) setDest("Settings");
  }, []);

  const submit = useCallback(async (value: string) => {
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin: value }),
    });
    if (res.ok) {
      const next = new URLSearchParams(window.location.search).get("next");
      window.location.href = next && next.startsWith("/admin") ? next : "/admin";
      return;
    }
    setError((await res.json().catch(() => ({})))?.error ?? "Sign in failed");
    setPin("");
    setShake(true);
    setTimeout(() => setShake(false), 500);
    setBusy(false);
  }, []);

  const press = useCallback(
    (k: string) => {
      if (busy) return;
      if (k === "⌫") return setPin((p) => p.slice(0, -1));
      if (!/^\d$/.test(k)) return;
      setPin((p) => {
        if (p.length >= LENGTH) return p;
        const next = p + k;
        if (next.length === LENGTH) submit(next);
        return next;
      });
    },
    [busy, submit]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) press(e.key);
      else if (e.key === "Backspace") press("⌫");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [press]);

  return (
    <div className="mx-auto flex max-w-sm flex-col px-4 py-12">
      <div className="card p-8 text-center">
        <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-amber-700 via-yellow-200 to-amber-500 text-amber-950">
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.2">
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V8a4 4 0 118 0v3" strokeLinecap="round" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold">Admin access</h1>
        <p className="mt-1 text-sm text-slate-400">
          Enter your {LENGTH}-digit admin PIN{dest ? ` to open the ${dest}` : ""}
        </p>

        <div className={`my-7 flex justify-center gap-4 ${shake ? "animate-[shake_.4s]" : ""}`}>
          {Array.from({ length: LENGTH }, (_, i) => (
            <span
              key={i}
              className={`h-4 w-4 rounded-full border-2 transition ${
                i < pin.length ? "scale-110 border-amber-300 bg-amber-300" : "border-slate-500"
              }`}
            />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3">
          {KEYS.map((k, i) =>
            k ? (
              <button
                key={i}
                type="button"
                disabled={busy}
                onClick={() => press(k)}
                aria-label={k === "⌫" ? "Delete" : k}
                className="h-16 rounded-2xl border border-white/10 bg-white/5 text-2xl font-semibold transition hover:bg-white/10 active:scale-95 active:bg-amber-400/20 disabled:opacity-50"
              >
                {k}
              </button>
            ) : (
              <span key={i} />
            )
          )}
        </div>

        <p className={`mt-5 min-h-5 text-sm ${error ? "text-red-300" : "text-slate-500"}`}>
          {busy ? "Checking…" : error || "Only the admin can sign in."}
        </p>
      </div>
      <style>{`@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}`}</style>
    </div>
  );
}
