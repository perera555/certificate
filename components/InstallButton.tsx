"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type Platform = "ios" | "android" | "mac-safari" | "desktop" | "other";

function detect(): Platform {
  const ua = navigator.userAgent;
  const iOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (iOS) return "ios";
  if (/Android/i.test(ua)) return "android";
  const safari = /^((?!chrome|android|crios|fxios|edg).)*safari/i.test(ua);
  if (/Macintosh/.test(ua) && safari) return "mac-safari";
  if (/Windows|Macintosh|Linux|CrOS/.test(ua)) return "desktop";
  return "other";
}

const HELP: Record<Platform, string[]> = {
  ios: ["Open this site in Safari.", "Tap the Share button (square with an arrow).", "Choose “Add to Home Screen”, then tap Add."],
  "mac-safari": ["In Safari, open the File menu (or the Share button).", "Choose “Add to Dock”.", "The app opens in its own window."],
  android: ["Open the browser menu (⋮).", "Tap “Install app” or “Add to Home screen”.", "Confirm to install."],
  desktop: [
    "Chrome / Edge: click the install icon at the right of the address bar,",
    "or open the menu (⋮ / …) → “Install Original Certificate Creator”.",
    "On Windows it appears in the Start menu; on Mac in Launchpad.",
  ],
  other: ["Open your browser menu and choose “Install app” or “Add to Home Screen”."],
};

export default function InstallButton() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [platform, setPlatform] = useState<Platform>("other");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setPlatform(detect());
    setInstalled(
      window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as Navigator & { standalone?: boolean }).standalone === true
    );
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    if ("serviceWorker" in navigator) {
      if (process.env.NODE_ENV === "production") {
        navigator.serviceWorker.register("/sw.js").then((r) => r.update()).catch(() => {});
      } else {
        // Never cache in development: remove any old worker + caches so edits show immediately.
        navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister()));
        caches?.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
      }
    }
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;

  async function install() {
    if (deferred) {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === "accepted") setInstalled(true);
      setDeferred(null);
    } else setOpen(true);
  }

  return (
    <>
      <button
        onClick={install}
        className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 px-4 py-2 text-sm font-semibold text-slate-900 shadow hover:brightness-105 active:scale-[.98]"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M12 3v12m0 0l-5-5m5 5l5-5M5 21h14" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Install app
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 text-slate-800 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold">Install on your device</h2>
            <p className="mt-1 text-sm text-slate-500">Works on Windows, Mac, iPhone, iPad and Android, with no app store needed.</p>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm">
              {HELP[platform].map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
            <button onClick={() => setOpen(false)} className="mt-6 w-full rounded-lg bg-slate-900 py-2.5 text-sm font-semibold text-white">
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
