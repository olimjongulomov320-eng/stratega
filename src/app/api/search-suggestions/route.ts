import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) {
    return NextResponse.json({ products: [], categories: [] });
  }

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: {
        isActive: true,
        OR: [{ name: { contains: q } }, { description: { contains: q } }],
      },
      take: 6,
      orderBy: { soldCount: "desc" },
      select: {
        id: true,
        slug: true,
        name: true,
        price: true,
        imageUrl: true,
      },
    }),
    prisma.category.findMany({
      where: { name: { contains: q } },
      take: 3,
      select: { slug: true, name: true, icon: true },
    }),
  ]);

  return NextResponse.json({ products, categories });
}
