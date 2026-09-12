import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestLocale } from "@/lib/request-locale";
import { localizeProduct, localizeCategory } from "@/lib/localize";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/product/[slug]">
) {
  const { slug } = await context.params;

  const productRaw = await prisma.product.findUnique({
    where: { slug },
    include: { category: true },
  });

  if (!productRaw || !productRaw.isActive) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const locale = await getRequestLocale();
  const product = {
    ...localizeProduct(productRaw, locale),
    category: localizeCategory(productRaw.category, locale),
  };

  return NextResponse.json({ product });
}
