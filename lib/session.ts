/** Signed session tokens using Web Crypto (works in Proxy and Route Handlers). */

export const SESSION_COOKIE = "oc_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function secret() {
  const s = process.env.AUTH_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV === "production") {
    // Fallback so prod still works; set AUTH_SECRET for best security.
    return `oc-fallback-${process.env.ADMIN_PIN ?? ""}-${process.env.VERCEL_PROJECT_ID ?? ""}`;
  }
  return "dev-only-secret-change-me";
}

const enc = new TextEncoder();

function b64url(bytes: ArrayBuffer | Uint8Array) {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  arr.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmac(data: string) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
  return b64url(await crypto.subtle.sign("HMAC", key, enc.encode(data)));
}

export interface SessionData {
  uid: string;
  role: "admin" | "staff";
}

export async function createSessionToken(data: SessionData) {
  const payload = b64url(enc.encode(JSON.stringify({ ...data, exp: Math.floor(Date.now() / 1000) + MAX_AGE })));
  return `${payload}.${await hmac(payload)}`;
}

export async function verifySessionToken(token: string | undefined): Promise<SessionData | null> {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  if ((await hmac(payload)) !== sig) return null;
  try {
    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    if (typeof json.exp !== "number" || json.exp < Date.now() / 1000) return null;
    if (typeof json.uid !== "string" || (json.role !== "admin" && json.role !== "staff")) return null;
    return { uid: json.uid, role: json.role };
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: MAX_AGE,
};

/** Admin PIN comes only from the ADMIN_PIN environment variable (never hard-coded). */
export function adminPin(): string | null {
  const pin = process.env.ADMIN_PIN?.trim();
  return pin && /^\d{4,12}$/.test(pin) ? pin : null;
}
