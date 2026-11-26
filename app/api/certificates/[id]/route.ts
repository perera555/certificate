import { getAdmin, handleError, unauthorized } from "@/lib/auth";
import { deleteDoc, getDoc, putDoc } from "@/lib/db";
import type { Certificate } from "@/lib/types";
import { cleanCertificate } from "@/lib/validate";

export async function GET(_req: Request, ctx: RouteContext<"/api/certificates/[id]">) {
  if (!(await getAdmin())) return unauthorized();
  const { id } = await ctx.params;
  const doc = await getDoc<Certificate>("certificates", id);
  return doc ? Response.json(doc) : Response.json({ error: "Not found" }, { status: 404 });
}

export async function PUT(request: Request, ctx: RouteContext<"/api/certificates/[id]">) {
  if (!(await getAdmin())) return unauthorized();
  try {
    const { id } = await ctx.params;
    const existing = await getDoc<Certificate>("certificates", id);
    if (!existing) return Response.json({ error: "Not found" }, { status: 404 });
    const updated: Certificate = {
      ...existing,
      ...cleanCertificate(await request.json()),
      updatedAt: new Date().toISOString(),
    };
    return Response.json(await putDoc("certificates", updated));
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/certificates/[id]">) {
  if (!(await getAdmin())) return unauthorized();
  try {
    const { id } = await ctx.params;
    await deleteDoc("certificates", id);
    return Response.json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
