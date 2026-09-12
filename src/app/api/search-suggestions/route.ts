import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestLocale } from "@/lib/request-locale";
import { localizeProduct, localizeCategory } from "@/lib/localize";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) {
    return NextResponse.json({ products: [], categories: [] });
  }

  const locale = await getRequestLocale();
  const [productsRaw, categoriesRaw] = await Promise.all([
    prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: q } },
          { description: { contains: q } },
          { nameRu: { contains: q } },
          { descriptionRu: { contains: q } },
          { nameEn: { contains: q } },
          { descriptionEn: { contains: q } },
        ],
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
        OR: [
          { name: { contains: q } },
          { nameRu: { contains: q } },
          { nameEn: { contains: q } },
        ],
      },
      take: 3,
      select: { slug: true, name: true, nameRu: true, nameEn: true, icon: true },
    }),
  ]);

  const products = productsRaw.map((p) => localizeProduct(p, locale));
  const categories = categoriesRaw.map((c) => localizeCategory(c, locale));

  return NextResponse.json({ products, categories });
}
