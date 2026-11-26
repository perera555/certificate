import { getAdmin, unauthorized } from "@/lib/auth";

export async function GET() {
  const me = await getAdmin();
  return me ? Response.json(me) : unauthorized();
}
