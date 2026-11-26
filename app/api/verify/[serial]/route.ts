import { getDoc, listDocs } from "@/lib/db";
import { DEFAULT_SETTINGS, type Certificate, type OrgSettings, type Sticker } from "@/lib/types";

/** Public: look up a certificate by serial number (or id) so anyone can check it is genuine. */
export async function GET(_req: Request, ctx: RouteContext<"/api/verify/[serial]">) {
  const { serial } = await ctx.params;
  const key = decodeURIComponent(serial).trim().toUpperCase();
  const certs = await listDocs<Certificate>("certificates");
  const cert = certs.find((c) => c.serial === key || c.id.toUpperCase() === key);
  if (!cert) return Response.json({ found: false }, { status: 404 });

  const ids = new Set([...cert.placed.map((p) => p.stickerId), cert.pattern.stickerId].filter(Boolean));
  const stickers = (await Promise.all([...ids].map((id) => getDoc<Sticker>("stickers", id)))).filter(
    (s): s is Sticker => !!s
  );
  const settings = (await getDoc<OrgSettings>("settings", "org")) ?? DEFAULT_SETTINGS;
  return Response.json({ found: true, certificate: cert, stickers, settings });
}
