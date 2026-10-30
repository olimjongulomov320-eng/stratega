import { prisma } from "@/lib/prisma";
import { isLocale } from "@/i18n/config";
import { localName, localDescription } from "@/lib/localize";
import { toCard } from "@/lib/products";

export async function POST(req: Request) {
  let body: { ids?: unknown; locale?: unknown; full?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ products: [] }, { status: 400 });
  }
  const ids = Array.isArray(body.ids) ? body.ids.filter((x): x is string => typeof x === "string").slice(0, 50) : [];
  const locale = typeof body.locale === "string" && isLocale(body.locale) ? body.locale : "uz";
  if (ids.length === 0) return Response.json({ products: [] });
  const products = await prisma.product.findMany({ where: { id: { in: ids }, isActive: true }, include: { category: true } });
  const order = new Map(ids.map((id, i) => [id, i]));
  products.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  return Response.json({
    products: products.map((p) =>
      body.full
        ? { ...toCard(p, locale), description: localDescription(p, locale), categoryName: localName(p.category, locale) }
        : toCard(p, locale)
    ),
  });
}
