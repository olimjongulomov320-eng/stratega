import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestLocale } from "@/lib/request-locale";
import { localizeProduct, localizeCategory } from "@/lib/localize";
import { searchQueryVariants } from "@/lib/search-normalize";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) {
    return NextResponse.json({ products: [], categories: [] });
  }

  const locale = await getRequestLocale();
  const variants = searchQueryVariants(q);
  const productOr = variants.flatMap((v) => [
    { name: { contains: v, mode: "insensitive" as const } },
    { description: { contains: v, mode: "insensitive" as const } },
    { nameRu: { contains: v, mode: "insensitive" as const } },
    { descriptionRu: { contains: v, mode: "insensitive" as const } },
    { nameEn: { contains: v, mode: "insensitive" as const } },
    { descriptionEn: { contains: v, mode: "insensitive" as const } },
  ]);
  const categoryOr = variants.flatMap((v) => [
    { name: { contains: v, mode: "insensitive" as const } },
    { nameRu: { contains: v, mode: "insensitive" as const } },
    { nameEn: { contains: v, mode: "insensitive" as const } },
  ]);

  const [productsRaw, categoriesRaw] = await Promise.all([
    prisma.product.findMany({
      where: {
        isActive: true,
        OR: productOr,
      },
      take: 6,
      orderBy: { soldCount: "desc" },
      select: {
        id: true,
        slug: true,
        name: true,
        nameRu: true,
        nameEn: true,
        description: true,
        descriptionRu: true,
        descriptionEn: true,
        price: true,
        imageUrl: true,
      },
    }),
    prisma.category.findMany({
      where: {
        OR: categoryOr,
      },
      take: 3,
      select: { slug: true, name: true, nameRu: true, nameEn: true, icon: true },
    }),
  ]);

  const products = productsRaw.map((p) => localizeProduct(p, locale));
  const categories = categoriesRaw.map((c) => localizeCategory(c, locale));

  return NextResponse.json({ products, categories });
}
