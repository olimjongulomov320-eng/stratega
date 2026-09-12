import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestLocale } from "@/lib/request-locale";
import { localizeProduct } from "@/lib/localize";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const ids = Array.isArray(body?.ids)
    ? body.ids.filter((id: unknown): id is string => typeof id === "string")
    : [];

  if (ids.length === 0) {
    return NextResponse.json({ products: [] });
  }

  const locale = await getRequestLocale();
  const productsRaw = await prisma.product.findMany({
    where: { id: { in: ids.slice(0, 50) }, isActive: true },
    include: { category: true },
  });
  const products = productsRaw.map((p) => localizeProduct(p, locale));

  return NextResponse.json({ products });
}
