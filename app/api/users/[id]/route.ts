import { forbidden, getAdmin, handleError, unauthorized } from "@/lib/auth";
import { deleteDoc, getDoc, putDoc } from "@/lib/db";
import { findByPin, hashPin, newSalt, toPublic, validPin, type AppUser } from "@/lib/users";

export async function PUT(request: Request, ctx: RouteContext<"/api/users/[id]">) {
  const me = await getAdmin();
  if (!me) return unauthorized();
  if (me.role !== "admin") return forbidden();
  try {
    const { id } = await ctx.params;
    const user = await getDoc<AppUser>("users", id);
    if (!user) return Response.json({ error: "Not found" }, { status: 404 });
    const body = await request.json().catch(() => ({}));

    if (typeof body.name === "string" && body.name.trim()) user.name = body.name.trim().slice(0, 60);
    if (body.role === "admin" || body.role === "staff") user.role = body.role;
    if (typeof body.active === "boolean") user.active = body.active;
    if (body.pin !== undefined && body.pin !== "") {
      if (!validPin(body.pin)) return Response.json({ error: "PIN must be 4 to 8 digits" }, { status: 400 });
      const owner = await findByPin(body.pin);
      if (owner && (owner === "owner" || owner.id !== user.id)) {
        return Response.json({ error: "That PIN is already used. Choose another." }, { status: 409 });
      }
      user.salt = newSalt();
      user.pinHash = await hashPin(body.pin, user.salt);
    }
    if (user.id === me.id && (user.role !== "admin" || !user.active)) {
      return Response.json({ error: "You can't remove your own admin access." }, { status: 400 });
    }
    user.updatedAt = new Date().toISOString();
    await putDoc("users", user);
    return Response.json(toPublic(user));
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/users/[id]">) {
  const me = await getAdmin();
  if (!me) return unauthorized();
  if (me.role !== "admin") return forbidden();
  try {
    const { id } = await ctx.params;
    if (id === me.id) return Response.json({ error: "You can't delete your own account." }, { status: 400 });
    await deleteDoc("users", id);
    return Response.json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
