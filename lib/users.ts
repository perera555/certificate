import "server-only";
import { listDocs } from "./db";
import { adminPin } from "./session";

export type Role = "admin" | "staff";

export interface AppUser {
  id: string;
  name: string;
  role: Role;
  active: boolean;
  salt: string;
  pinHash: string;
  createdAt: string;
  updatedAt: string;
}

export type PublicUser = Omit<AppUser, "salt" | "pinHash">;

export const OWNER = { id: "owner", name: "Main admin", role: "admin" as Role };

const enc = new TextEncoder();
const hex = (buf: ArrayBuffer) => Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");

export function newSalt() {
  return hex(crypto.getRandomValues(new Uint8Array(16)).buffer);
}

export async function hashPin(pin: string, salt: string) {
  const key = await crypto.subtle.importKey("raw", enc.encode(pin), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: enc.encode(salt), iterations: 60_000 }, key, 256);
  return hex(bits);
}

export const validPin = (pin: unknown): pin is string => typeof pin === "string" && /^\d{4,8}$/.test(pin);

export function toPublic(u: AppUser): PublicUser {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { salt, pinHash, ...rest } = u;
  return rest;
}

/** Returns the user that owns this PIN (any status), "owner" for the env PIN, or null. */
export async function findByPin(pin: string, users?: AppUser[]): Promise<AppUser | "owner" | null> {
  if (adminPin() === pin) return "owner";
  for (const u of users ?? (await listDocs<AppUser>("users"))) {
    if ((await hashPin(pin, u.salt)) === u.pinHash) return u;
  }
  return null;
}
