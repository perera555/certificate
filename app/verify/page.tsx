"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import QrScanner from "@/components/QrScanner";

/** Turns any typed/pasted text (or a verify link) into the OC-YYYY-XXXX-XXXX format. */
function formatSerial(input: string) {
  const fromLink = input.match(/\/verify\/([^/?#\s]+)/);
  const raw = (fromLink ? decodeURIComponent(fromLink[1]) : input).toUpperCase().replace(/[^A-Z0-9]/g, "");
  const body = raw.startsWith("OC") ? raw.slice(2) : raw;
  const parts = [body.slice(0, 4), body.slice(4, 8), body.slice(8, 12)].filter(Boolean);
  return { text: parts.length ? `OC-${parts.join("-")}` : raw ? "OC-" : "", complete: body.length >= 12 };
}

export default function VerifySearch() {
  const router = useRouter();
  const [serial, setSerial] = useState("");
  const [checking, setChecking] = useState(false);
  const [canPaste, setCanPaste] = useState(false);

  const go = useCallback(
    (s: string) => {
      const value = s.trim().toUpperCase();
      if (!value) return;
      setChecking(true);
      router.push(`/verify/${encodeURIComponent(value)}`);
    },
    [router]
  );

  const fill = useCallback(
    (value: string) => {
      const f = formatSerial(value);
      setSerial(f.text);
      if (f.complete) go(f.text);
    },
    [go]
  );

  useEffect(() => {
    setCanPaste(!!navigator.clipboard?.readText);
    const q = new URLSearchParams(window.location.search).get("serial");
    if (q) fill(q);
  }, [fill]);

  async function paste() {
    try {
      fill(await navigator.clipboard.readText());
    } catch {
      /* permission denied */
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <h1 className="text-4xl font-bold">
        Verify a <span className="gold-text">certificate</span>
      </h1>
      <p className="mt-3 text-slate-400">
        Scan the QR code or type the certificate number. The dashes fill in automatically, and the check starts as soon as the
        number is complete.
      </p>
      <form
        className="mt-8 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          go(serial);
        }}
      >
        <div className="relative flex-1">
          <input
            className="input py-3 pr-20 font-mono tracking-wider uppercase"
            placeholder="OC-2026-XXXX-XXXX"
            inputMode="text"
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            autoFocus
            value={serial}
            onChange={(e) => fill(e.target.value)}
            onPaste={(e) => {
              e.preventDefault();
              fill(e.clipboardData.getData("text"));
            }}
          />
          {canPaste && (
            <button
              type="button"
              onClick={paste}
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md bg-white/10 px-2.5 py-1 text-xs font-medium text-slate-200 hover:bg-white/20"
            >
              Paste
            </button>
          )}
        </div>
        <button className="btn-gold px-6" disabled={checking}>
          {checking ? "Checking…" : "Verify"}
        </button>
      </form>
      <QrScanner onSerial={fill} />
    </div>
  );
}
