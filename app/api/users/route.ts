import { forbidden, getAdmin, handleError, unauthorized } from "@/lib/auth";
import { listDocs, newId, putDoc } from "@/lib/db";
import { findByPin, hashPin, newSalt, toPublic, validPin, type AppUser } from "@/lib/users";

export async function GET() {
  const me = await getAdmin();
  if (!me) return unauthorized();
  if (me.role !== "admin") return forbidden();
  try {
    const users = await listDocs<AppUser>("users");
    users.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return Response.json(users.map(toPublic));
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(request: Request) {
  const me = await getAdmin();
  if (!me) return unauthorized();
  if (me.role !== "admin") return forbidden();
  try {
    const body = await request.json().catch(() => ({}));
    const name = String(body?.name ?? "").trim().slice(0, 60);
    const role = body?.role === "admin" ? "admin" : "staff";
    if (!name) return Response.json({ error: "Enter a name" }, { status: 400 });
    if (!validPin(body?.pin)) return Response.json({ error: "PIN must be 4 to 8 digits" }, { status: 400 });
    if (await findByPin(body.pin)) return Response.json({ error: "That PIN is already used. Choose another." }, { status: 409 });

    const now = new Date().toISOString();
    const salt = newSalt();
    const user: AppUser = { id: newId(), name, role, active: true, salt, pinHash: await hashPin(body.pin, salt), createdAt: now, updatedAt: now };
    await putDoc("users", user);
    return Response.json(toPublic(user), { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
