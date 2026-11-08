import { timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { LOCALES, localePath } from "@/i18n/config";
import { absoluteUrl } from "@/lib/seo";
import { productLocales } from "@/lib/product-seo";
import { submitToIndexNow } from "@/lib/indexnow";

/** Daily: tell search engines about products and categories changed in the last day. Called by Vercel Cron (vercel.json). */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const received = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  if (!secret || received.length !== expected.length || !timingSafeEqual(Buffer.from(received), Buffer.from(expected))) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }
  const since = new Date(Date.now() - 26 * 60 * 60 * 1000);
  const [products, categories] = await Promise.all([
    prisma.product.findMany({ where: { isActive: true, updatedAt: { gte: since } }, select: { slug: true, nameRu: true, nameEn: true } }),
    prisma.category.findMany({ where: { isActive: true, updatedAt: { gte: since } }, select: { slug: true } }),
  ]);
  const urls = [
    ...products.flatMap((p) => productLocales(p).map((l) => absoluteUrl(localePath(l, `/product/${p.slug}`)))),
    ...categories.flatMap((c) => LOCALES.map((l) => absoluteUrl(localePath(l, `/category/${c.slug}`)))),
  ];
  if (!urls.length) return Response.json({ submitted: 0 });
  const statuses = await submitToIndexNow([...urls, absoluteUrl("/sitemap.xml")]);
  return Response.json({ submitted: urls.length, statuses });
}
