import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "./session";
import { getDoc, StorageNotConfiguredError } from "./db";
import { OWNER, type AppUser, type Role } from "./users";

export interface CurrentUser {
  id: string;
  name: string;
  role: Role;
}

/** The signed-in user (main admin or a user created on the Users page), or null. */
export async function getAdmin(): Promise<CurrentUser | null> {
  const store = await cookies();
  const session = await verifySessionToken(store.get(SESSION_COOKIE)?.value);
  if (!session) return null;
  if (session.uid === OWNER.id) return OWNER;
  // Re-check the account so deleted/disabled users and role changes take effect immediately.
  const user = await getDoc<AppUser>("users", session.uid);
  if (!user || !user.active) return null;
  return { id: user.id, name: user.name, role: user.role };
}

export function unauthorized() {
  return Response.json({ error: "Not signed in" }, { status: 401 });
}

export function forbidden() {
  return Response.json({ error: "Only admins can do this" }, { status: 403 });
}

export function handleError(err: unknown) {
  if (err instanceof StorageNotConfiguredError) return Response.json({ error: err.message }, { status: 503 });
  console.error(err);
  return Response.json({ error: "Something went wrong" }, { status: 500 });
}
