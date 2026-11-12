import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isLocale } from "@/i18n/config";
import { localName } from "@/lib/localize";
import { searchWhere } from "@/lib/products";
import { matchCategories } from "@/lib/category-match";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim().slice(0, 100) ?? "";
  const l = request.nextUrl.searchParams.get("locale") ?? "uz";
  const locale = isLocale(l) ? l : "uz";
  if (q.length < 2) return NextResponse.json({ products: [], categories: [] });

  const named = matchCategories(q);
  const [products, byName, bySynonym] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true, ...searchWhere(q) },
      take: 6,
      // Machines before spare parts, priced before "price on request".
      orderBy: [{ category: { isSparePart: "asc" } }, { isFeatured: "desc" }, { priceOnRequest: "asc" }, { stock: "desc" }],
    }),
    prisma.category.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { nameRu: { contains: q, mode: "insensitive" } },
          { nameEn: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 3,
    }),
    named.length ? prisma.category.findMany({ where: { isActive: true, slug: { in: named } } }) : Promise.resolve([]),
  ]);
  // Categories found through buyers' words ("пайка", "керхер") come first, in match order.
  const categories = [...named.map((s) => bySynonym.find((c) => c.slug === s)).filter((c) => c !== undefined), ...byName]
    .filter((c, i, all) => all.findIndex((x) => x.slug === c.slug) === i)
    .slice(0, 3);
  return NextResponse.json({
    products: products.map((p) => ({ id: p.id, slug: p.slug, name: localName(p, locale), price: p.priceOnRequest ? 0 : p.price, imageUrl: p.imageUrl })),
    categories: categories.map((c) => ({ slug: c.slug, name: localName(c, locale), icon: c.icon })),
  });
}
