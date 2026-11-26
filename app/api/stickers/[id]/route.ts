import { getAdmin, handleError, unauthorized } from "@/lib/auth";
import { deleteDoc, getDoc, putDoc } from "@/lib/db";
import type { Sticker } from "@/lib/types";
import { cleanSticker } from "@/lib/validate";

export async function GET(_req: Request, ctx: RouteContext<"/api/stickers/[id]">) {
  if (!(await getAdmin())) return unauthorized();
  const { id } = await ctx.params;
  const doc = await getDoc<Sticker>("stickers", id);
  return doc ? Response.json(doc) : Response.json({ error: "Not found" }, { status: 404 });
}

export async function PUT(request: Request, ctx: RouteContext<"/api/stickers/[id]">) {
  if (!(await getAdmin())) return unauthorized();
  try {
    const { id } = await ctx.params;
    const existing = await getDoc<Sticker>("stickers", id);
    if (!existing) return Response.json({ error: "Not found" }, { status: 404 });
    const updated: Sticker = {
      ...existing,
      ...cleanSticker(await request.json()),
      updatedAt: new Date().toISOString(),
    };
    return Response.json(await putDoc("stickers", updated));
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/stickers/[id]">) {
  if (!(await getAdmin())) return unauthorized();
  try {
    const { id } = await ctx.params;
    await deleteDoc("stickers", id);
    return Response.json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
