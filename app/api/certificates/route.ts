import { getAdmin, handleError, unauthorized } from "@/lib/auth";
import { listDocs, newId, newSerial, putDoc } from "@/lib/db";
import type { Certificate } from "@/lib/types";
import { cleanCertificate } from "@/lib/validate";

export async function GET() {
  if (!(await getAdmin())) return unauthorized();
  try {
    const items = await listDocs<Certificate>("certificates");
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
    const cert: Certificate = {
      id: newId(),
      serial: newSerial(),
      ...cleanCertificate(await request.json()),
      createdAt: now,
      updatedAt: now,
    };
    return Response.json(await putDoc("certificates", cert), { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
