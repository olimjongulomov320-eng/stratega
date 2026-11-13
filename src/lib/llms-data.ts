import { prisma } from "@/lib/prisma";

/** Loads what both /llms.txt (summary) and /llms-full.txt (every product) are built from. */
export async function llmsData() {
  const [categories, products] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true, products: { some: { isActive: true } } },
      orderBy: [{ isSparePart: "asc" }, { sortOrder: "asc" }],
      select: { slug: true, name: true, nameRu: true, nameEn: true },
    }),
    prisma.product.findMany({
      where: { isActive: true, category: { isActive: true } },
      orderBy: [{ isFeatured: "desc" }, { name: "asc" }],
      select: {
        slug: true, name: true, nameRu: true, nameEn: true, description: true, descriptionRu: true, brand: true, sku: true, price: true, priceOnRequest: true, stock: true, sourcing: true,
        specs: true, capacityKg: true, liftHeightMm: true, workingWidthMm: true, powerKw: true,
        category: { select: { slug: true } },
      },
    }),
  ]);
  return { categories, products: products.map(({ category, ...p }) => ({ ...p, categorySlug: category.slug })) };
}

export const LLMS_HEADERS = { "content-type": "text/plain; charset=utf-8", "cache-control": "public, s-maxage=3600, stale-while-revalidate=86400" };
