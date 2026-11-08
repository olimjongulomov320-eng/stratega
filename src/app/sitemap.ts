import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { LOCALES, localePath } from "@/i18n/config";
import { absoluteUrl } from "@/lib/seo";
import { FOCUS } from "@/lib/focus";
import { productLocales } from "@/lib/product-seo";
import type { Locale } from "@/i18n/config";

// Built on each request: the cached version stayed stale, so products added in the admin never reached search engines.
export const dynamic = "force-dynamic";

function entry(path: string, lastModified: Date, priority: number, locales: readonly Locale[] = LOCALES): MetadataRoute.Sitemap {
  const languages: Record<string, string> = {};
  for (const l of locales) languages[l] = absoluteUrl(localePath(l, path));
  languages["x-default"] = absoluteUrl(path);
  return locales.map((l) => ({
    url: absoluteUrl(localePath(l, path)),
    lastModified,
    changeFrequency: "weekly" as const,
    priority,
    alternates: { languages },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products] = await Promise.all([
    prisma.category.findMany({ where: { isActive: true, products: { some: { isActive: true } } }, select: { slug: true, updatedAt: true, isSparePart: true } }),
    prisma.product.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true, nameRu: true, nameEn: true } }),
  ]);
  const now = new Date();
  return [
    ...entry("/", now, 1),
    ...entry("/search", now, 0.7),
    ...(categories.some((c) => c.isSparePart) ? entry("/ehtiyot-qismlar", now, 0.7) : []),
    // Direction landing pages that have at least one category with products on sale.
    ...FOCUS.filter((f) => f.categories.some((s) => categories.some((c) => c.slug === s))).flatMap((f) => entry(`/yonalish/${f.slug}`, now, 0.95)),
    ...categories.flatMap((c) => entry(`/category/${c.slug}`, c.updatedAt, 0.9)),
    ...products.flatMap((p) => entry(`/product/${p.slug}`, p.updatedAt, 0.8, productLocales(p))),
    ...["/yuridik-shaxslar", "/about", "/delivery", "/payment", "/returns", "/faq", "/contacts"].flatMap((p) => entry(p, now, 0.4)),
  ];
}
