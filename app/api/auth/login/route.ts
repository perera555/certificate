import { cookies, headers } from "next/headers";
import { adminPin, createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";
import { findByPin, OWNER } from "@/lib/users";

// Simple brute-force protection: 5 wrong PINs per IP -> locked for 15 minutes.
const attempts = new Map<string, { count: number; until: number }>();
const MAX_TRIES = 5;
const LOCK_MS = 15 * 60 * 1000;

export async function POST(request: Request) {
  if (!adminPin()) {
    return Response.json(
      { error: "Admin PIN is not set. Add ADMIN_PIN to the environment variables (.env.local or Vercel) and restart." },
      { status: 503 }
    );
  }

  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "local").split(",")[0].trim();
  const now = Date.now();
  let rec = attempts.get(ip);
  if (rec && rec.until > now) {
    const mins = Math.ceil((rec.until - now) / 60000);
    return Response.json({ error: `Too many wrong PINs. Try again in ${mins} minute${mins > 1 ? "s" : ""}.` }, { status: 429 });
  }
  if (rec && rec.until && rec.until <= now) rec = undefined; // lock expired

  const body = await request.json().catch(() => ({}));
  const given = String(body?.pin ?? "").trim();
  const match = /^\d{4,12}$/.test(given) ? await findByPin(given).catch(() => null) : null;
  const user = match === "owner" ? OWNER : match && match.active ? match : null;

  if (!user) {
    const count = (rec?.count ?? 0) + 1;
    attempts.set(ip, { count, until: count >= MAX_TRIES ? now + LOCK_MS : 0 });
    await new Promise((r) => setTimeout(r, 700));
    const left = MAX_TRIES - count;
    return Response.json(
      { error: left > 0 ? `Wrong PIN. ${left} tr${left === 1 ? "y" : "ies"} left.` : "Too many wrong PINs. Locked for 15 minutes." },
      { status: 401 }
    );
  }

  attempts.delete(ip);
  const store = await cookies();
  store.set(SESSION_COOKIE, await createSessionToken({ uid: user.id, role: user.role }), sessionCookieOptions);
  return Response.json({ ok: true, name: user.name, role: user.role });
}
