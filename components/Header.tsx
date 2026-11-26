"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import InstallButton from "./InstallButton";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/stickers", label: "Sticker Creator" },
  { href: "/admin/certificates", label: "Certificate Creator" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/users", label: "Users & PINs", adminOnly: true },
  { href: "/verify", label: "Verify" },
];

export default function Header() {
  const path = usePathname();
  const inAdmin = path.startsWith("/admin");
  const [me, setMe] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    if (!inAdmin) return;
    fetch("/api/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then(setMe)
      .catch(() => setMe(null));
  }, [inAdmin]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0b1220]/80 backdrop-blur pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-amber-700 via-yellow-200 to-amber-500 text-lg font-black text-amber-950 shadow">
            ✓
          </span>
          <span className="hidden font-semibold tracking-tight sm:block">
            Original <span className="gold-text">Certificate</span> Creator
          </span>
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <InstallButton />
          {inAdmin && me && (
            <span className="hidden text-sm text-slate-400 md:block">
              {me.name} · <span className="capitalize">{me.role}</span>
            </span>
          )}
          {inAdmin ? (
            <button onClick={logout} className="btn-ghost">
              Sign out
            </button>
          ) : (
            <Link href="/admin" className="btn-ghost">
              Admin
            </Link>
          )}
        </div>
      </div>
      {inAdmin && (
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-2 text-sm">
          {NAV.filter((n) => !n.adminOnly || me?.role === "admin").map((n) => {
            const active = n.href === "/admin" ? path === "/admin" : path.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 transition ${
                  active ? "bg-amber-400/15 text-amber-200" : "text-slate-400 hover:text-slate-100"
                }`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
