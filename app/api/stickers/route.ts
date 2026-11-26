import { getAdmin, handleError, unauthorized } from "@/lib/auth";
import { listDocs, newId, putDoc } from "@/lib/db";
import type { Sticker } from "@/lib/types";
import { cleanSticker } from "@/lib/validate";

export async function GET() {
  if (!(await getAdmin())) return unauthorized();
  try {
    const items = await listDocs<Sticker>("stickers");
    items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return Response.json(items);
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(request: Request) {
  if (!(await getAdmin())) return unauthorized();
  try {
    const now = new Date().toISOString();
    const sticker: Sticker = { id: newId(), ...cleanSticker(await request.json()), createdAt: now, updatedAt: now };
    return Response.json(await putDoc("stickers", sticker), { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
