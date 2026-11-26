import { getAdmin, handleError, unauthorized } from "@/lib/auth";
import { getDoc, putDoc } from "@/lib/db";
import { DEFAULT_SETTINGS, type OrgSettings } from "@/lib/types";
import { cleanSettings } from "@/lib/validate";

export async function GET() {
  if (!(await getAdmin())) return unauthorized();
  return Response.json((await getDoc<OrgSettings>("settings", "org")) ?? DEFAULT_SETTINGS);
}

export async function PUT(request: Request) {
  if (!(await getAdmin())) return unauthorized();
  try {
    const settings: OrgSettings = {
      id: "org",
      ...cleanSettings(await request.json()),
      updatedAt: new Date().toISOString(),
    };
    return Response.json(await putDoc("settings", settings));
  } catch (e) {
    return handleError(e);
  }
}
