import { getAdmin, handleError, unauthorized } from "@/lib/auth";
import { getDoc, newId, putDoc, putFile } from "@/lib/db";
import {
  ALLOWED_TYPES,
  cleanFileName,
  collectionFor,
  listAttachments,
  MAX_FILE_BYTES,
  MAX_FILES_PER_CERT,
  type Attachment,
} from "@/lib/attachments";
import type { Certificate } from "@/lib/types";

export async function GET(_req: Request, ctx: RouteContext<"/api/certificates/[id]/attachments">) {
  if (!(await getAdmin())) return unauthorized();
  try {
    const { id } = await ctx.params;
    return Response.json(await listAttachments(id));
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(request: Request, ctx: RouteContext<"/api/certificates/[id]/attachments">) {
  const me = await getAdmin();
  if (!me) return unauthorized();
  try {
    const { id } = await ctx.params;
    if (!(await getDoc<Certificate>("certificates", id))) return Response.json({ error: "Certificate not found" }, { status: 404 });
    if ((await listAttachments(id)).length >= MAX_FILES_PER_CERT) {
      return Response.json({ error: `A certificate can have up to ${MAX_FILES_PER_CERT} documents.` }, { status: 400 });
    }

    const form = await request.formData().catch(() => null);
    const file = form?.get("file");
    if (!(file instanceof File)) return Response.json({ error: "No file received" }, { status: 400 });
    if (file.size === 0) return Response.json({ error: "The file is empty" }, { status: 400 });
    if (file.size > MAX_FILE_BYTES) return Response.json({ error: `${file.name} is larger than 4 MB` }, { status: 413 });
    const ext = ALLOWED_TYPES[file.type];
    if (!ext) return Response.json({ error: `${file.name}: only PDF, images, Word, Excel and text files are allowed` }, { status: 415 });

    const attId = newId();
    const key = `${id}/${attId}.${ext}`;
    await putFile(key, await file.arrayBuffer(), file.type);
    const att: Attachment = {
      id: attId,
      certId: id,
      name: cleanFileName(file.name),
      type: file.type,
      size: file.size,
      key,
      uploadedBy: me.name,
      createdAt: new Date().toISOString(),
    };
    await putDoc(collectionFor(id), att);
    return Response.json(att, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
