import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { LOCALES, localePath } from "@/i18n/config";
import { absoluteUrl } from "@/lib/seo";
import { FOCUS } from "@/lib/focus";

export const revalidate = 3600;

function entry(path: string, lastModified: Date, priority: number): MetadataRoute.Sitemap {
  const languages: Record<string, string> = {};
  for (const l of LOCALES) languages[l] = absoluteUrl(localePath(l, path));
  languages["x-default"] = absoluteUrl(path);
  return LOCALES.map((l) => ({
    url: absoluteUrl(localePath(l, path)),
    lastModified,
    changeFrequency: "weekly" as const,
    priority,
    alternates: { languages },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products] = await Promise.all([
    prisma.category.findMany({ where: { isActive: true, products: { some: { isActive: true } } }, select: { slug: true, updatedAt: true } }),
    prisma.product.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
  ]);
  const now = new Date();
  return [
    ...entry("/", now, 1),
    ...entry("/search", now, 0.7),
    ...entry("/ehtiyot-qismlar", now, 0.7),
    // Direction landing pages that have at least one category with products on sale.
    ...FOCUS.filter((f) => f.categories.some((s) => categories.some((c) => c.slug === s))).flatMap((f) => entry(`/yonalish/${f.slug}`, now, 0.95)),
    ...categories.flatMap((c) => entry(`/category/${c.slug}`, c.updatedAt, 0.9)),
    ...products.flatMap((p) => entry(`/product/${p.slug}`, p.updatedAt, 0.8)),
    ...["/yuridik-shaxslar", "/about", "/delivery", "/payment", "/returns", "/faq", "/contacts"].flatMap((p) => entry(p, now, 0.4)),
  ];
}
