"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client";

type Role = "admin" | "staff";
interface User {
  id: string;
  name: string;
  role: Role;
  active: boolean;
  createdAt: string;
}
interface Me {
  id: string;
  name: string;
  role: Role;
}

const randomPin = () => String(crypto.getRandomValues(new Uint32Array(1))[0] % 10000).padStart(4, "0");

export default function UsersPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [users, setUsers] = useState<User[] | null>(null);
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("staff");
  const [pin, setPin] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<Me>("/api/me")
      .then((m) => {
        setMe(m);
        if (m.role === "admin") return api<User[]>("/api/users").then(setUsers);
      })
      .catch((e) => setMsg({ ok: false, text: e.message }));
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const u = await api<User>("/api/users", { method: "POST", json: { name, role, pin } });
      setUsers((l) => [...(l ?? []), u]);
      setMsg({ ok: true, text: `${u.name} can now sign in with PIN ${pin}. Give them this PIN privately.` });
      setName("");
      setPin("");
    } catch (err) {
      setMsg({ ok: false, text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  async function update(u: User, patch: Partial<User> & { pin?: string }) {
    setMsg(null);
    try {
      const updated = await api<User>(`/api/users/${u.id}`, { method: "PUT", json: patch });
      setUsers((l) => l?.map((x) => (x.id === u.id ? updated : x)) ?? null);
      if (patch.pin) setMsg({ ok: true, text: `New PIN for ${u.name}: ${patch.pin}` });
    } catch (err) {
      setMsg({ ok: false, text: (err as Error).message });
    }
  }

  async function changePin(u: User) {
    const p = prompt(`New PIN for ${u.name} (4–8 digits):`, randomPin());
    if (p) await update(u, { pin: p.trim() });
  }

  async function remove(u: User) {
    if (!confirm(`Delete ${u.name}? They will be signed out and can no longer use their PIN.`)) return;
    try {
      await api(`/api/users/${u.id}`, { method: "DELETE" });
      setUsers((l) => l?.filter((x) => x.id !== u.id) ?? null);
    } catch (err) {
      setMsg({ ok: false, text: (err as Error).message });
    }
  }

  if (me && me.role !== "admin")
    return <p className="mx-auto max-w-3xl px-4 py-16 text-center text-slate-400">Only admins can manage users.</p>;

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-3xl font-bold">Users &amp; PINs</h1>
        <p className="text-slate-400">
          Create accounts and give each person their own PIN. <b className="text-slate-200">Admins</b> can also manage users;{" "}
          <b className="text-slate-200">staff</b> can create stickers and certificates only.
        </p>
      </div>

      <form onSubmit={create} className="card grid gap-4 p-5 sm:grid-cols-[1fr_140px_180px_auto] sm:items-end">
        <div>
          <label className="label">Name</label>
          <input className="input" required maxLength={60} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Office staff" />
        </div>
        <div>
          <label className="label">Role</label>
          <select className="input" value={role} onChange={(e) => setRole(e.target.value as Role)}>
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div>
          <label className="label">PIN (4–8 digits)</label>
          <div className="flex gap-1">
            <input
              className="input font-mono tracking-widest"
              required
              inputMode="numeric"
              pattern="\d{4,8}"
              maxLength={8}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            />
            <button type="button" className="btn-ghost px-2" title="Generate a random PIN" onClick={() => setPin(randomPin())}>
              🎲
            </button>
          </div>
        </div>
        <button className="btn-gold" disabled={busy}>{busy ? "Adding…" : "Add user"}</button>
      </form>

      {msg && <p className={`rounded-lg px-4 py-3 text-sm ${msg.ok ? "bg-emerald-500/10 text-emerald-300" : "bg-red-500/10 text-red-300"}`}>{msg.text}</p>}

      <div className="card divide-y divide-white/5">
        <div className="flex items-center justify-between gap-3 p-4">
          <div>
            <p className="font-medium">Main admin</p>
            <p className="text-xs text-slate-500">PIN set by the ADMIN_PIN environment variable · can&apos;t be deleted</p>
          </div>
          <span className="rounded-full bg-amber-400/15 px-2.5 py-0.5 text-xs text-amber-200">owner</span>
        </div>
        {users === null && <p className="p-4 text-sm text-slate-400">Loading…</p>}
        {users?.map((u) => (
          <div key={u.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className={`font-medium ${u.active ? "" : "text-slate-500 line-through"}`}>
                {u.name} {u.id === me?.id && <span className="text-xs text-slate-500">(you)</span>}
              </p>
              <p className="text-xs text-slate-500">Added {new Date(u.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select className="input w-auto py-1.5" value={u.role} onChange={(e) => update(u, { role: e.target.value as Role })}>
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
              <button className="btn-ghost px-3 py-1.5 text-xs" onClick={() => changePin(u)}>Change PIN</button>
              <button className="btn-ghost px-3 py-1.5 text-xs" onClick={() => update(u, { active: !u.active })}>
                {u.active ? "Disable" : "Enable"}
              </button>
              <button className="btn-danger px-3 py-1.5 text-xs" onClick={() => remove(u)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
