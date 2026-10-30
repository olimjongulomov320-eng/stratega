import { prisma } from "@/lib/prisma";
import type { Locale } from "@/i18n/config";
import { localName } from "@/lib/localize";
import { FOCUS } from "@/lib/focus";

export type HeaderCategory = {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
  productCount: number;
};

/** Machine categories for menus. Spare-part categories live in their own section (see getSparePartCategories). */
export async function getHeaderCategories(locale: Locale): Promise<HeaderCategory[]> {
  return categoriesWithProducts(locale, false);
}

export async function getSparePartCategories(locale: Locale): Promise<HeaderCategory[]> {
  return categoriesWithProducts(locale, true);
}

async function categoriesWithProducts(locale: Locale, isSparePart: boolean): Promise<HeaderCategory[]> {
  const categories = await prisma.category.findMany({
    where: { isActive: true, isSparePart },
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: { where: { isActive: true } } } } },
  });
  // Categories without visible products are hidden from menus (e.g. a new category whose products have no price yet).
  return categories.filter((c) => c._count.products > 0).map((c) => ({
    id: c.id,
    slug: c.slug,
    name: localName(c, locale),
    icon: c.icon,
    productCount: c._count.products,
  }));
}

export type MenuDirection = { slug: string; name: string; icon: string; productCount: number; categorySlugs: string[] };

/** Main directions that have products on sale, in FOCUS order, built from the visible categories. */
export function directionsFrom(categories: HeaderCategory[], locale: Locale): MenuDirection[] {
  const bySlug = new Map(categories.map((c) => [c.slug, c]));
  return FOCUS.map((f) => {
    const cats = f.categories.map((s) => bySlug.get(s)).filter((c): c is HeaderCategory => Boolean(c));
    return { slug: f.slug, name: f.name[locale], icon: f.icon, productCount: cats.reduce((n, c) => n + c.productCount, 0), categorySlugs: cats.map((c) => c.slug) };
  }).filter((d) => d.productCount > 0);
}
