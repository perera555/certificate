import { getAdmin, handleError, unauthorized } from "@/lib/auth";
import { deleteDoc, deleteFile, getDoc, getFile } from "@/lib/db";
import { collectionFor, type Attachment } from "@/lib/attachments";

type Ctx = RouteContext<"/api/certificates/[id]/attachments/[fileId]">;

export async function GET(request: Request, ctx: Ctx) {
  if (!(await getAdmin())) return unauthorized();
  const { id, fileId } = await ctx.params;
  const att = await getDoc<Attachment>(collectionFor(id), fileId);
  if (!att) return Response.json({ error: "Not found" }, { status: 404 });
  const stream = await getFile(att.key);
  if (!stream) return Response.json({ error: "File missing" }, { status: 404 });
  const inline = new URL(request.url).searchParams.has("view") && /^(application\/pdf|image\/)/.test(att.type);
  return new Response(stream, {
    headers: {
      "Content-Type": att.type,
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(att.name)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  if (!(await getAdmin())) return unauthorized();
  try {
    const { id, fileId } = await ctx.params;
    const att = await getDoc<Attachment>(collectionFor(id), fileId);
    if (!att) return Response.json({ error: "Not found" }, { status: 404 });
    await deleteFile(att.key);
    await deleteDoc(collectionFor(id), fileId);
    return Response.json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
