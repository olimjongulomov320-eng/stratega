import { prisma } from "@/lib/prisma";
import { isAvailable } from "@/lib/sourcing";
import { isLocale } from "@/i18n/config";
import { localName, localDescription } from "@/lib/localize";

export async function GET(req: Request, ctx: RouteContext<"/api/product/[slug]">) {
  const { slug } = await ctx.params;
  const l = new URL(req.url).searchParams.get("locale") ?? "uz";
  const locale = isLocale(l) ? l : "uz";
  const p = await prisma.product.findUnique({ where: { slug }, include: { category: true } });
  if (!p || !p.isActive) return Response.json({ product: null }, { status: 404 });
  return Response.json({
    product: {
      id: p.id,
      slug: p.slug,
      name: localName(p, locale),
      description: localDescription(p, locale),
      price: p.priceOnRequest ? 0 : p.price,
      oldPrice: p.priceOnRequest ? null : p.oldPrice,
      imageUrl: p.imageUrl,
      stock: p.stock,
      available: isAvailable(p),
      sku: p.sku,
      category: { name: localName(p.category, locale), slug: p.category.slug },
    },
  });
}
