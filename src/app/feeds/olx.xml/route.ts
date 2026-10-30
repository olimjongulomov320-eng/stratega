import { timingSafeEqual } from "crypto";
import { getOlxSettings, buildOlxRows, toYml } from "@/lib/olx";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Auto-updating YML/XML feed of OLX-ready adverts. Needs ?key=… from Admin → Mahsulotlar → OLX eksport. */
export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get("key") ?? "";
  const settings = await getOlxSettings();
  const a = Buffer.from(key);
  const b = Buffer.from(settings.feedKey);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return new Response("Not found", { status: 404 });
  const { rows } = await buildOlxRows(settings);
  return new Response(toYml(rows), {
    headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=900", "x-robots-tag": "noindex" },
  });
}
