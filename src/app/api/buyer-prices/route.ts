import { prisma } from "@/lib/prisma";
import { getBuyerPriceList, getBuyerPrices } from "@/lib/customer-price";

export const dynamic = "force-dynamic";

const MAX_IDS = 100;
const NEVER_CACHE = { "cache-control": "private, no-store" };

/**
 * The logged-in buyer's own prices for the given products. Cached public pages show the guest price and ask here
 * from the browser, so a buyer's price never ends up in a cached page. Empty for guests and for buyers without a
 * price list. "Price on request" items are left out, as they are everywhere on the site's pages.
 */
export async function POST(req: Request) {
  let body: { ids?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({}, { status: 400, headers: NEVER_CACHE });
  }
  const ids = Array.isArray(body.ids) ? body.ids.filter((x): x is string => typeof x === "string").slice(0, MAX_IDS) : [];

  const list = await getBuyerPriceList();
  if (!list || ids.length === 0) return Response.json({}, { headers: NEVER_CACHE });

  const [own, products] = await Promise.all([
    getBuyerPrices(ids),
    prisma.product.findMany({ where: { id: { in: ids }, isActive: true, priceOnRequest: false }, select: { id: true, price: true } }),
  ]);
  const prices: Record<string, number> = {};
  for (const p of products) {
    const price = own.get(p.id);
    if (price && price !== p.price) prices[p.id] = price;
  }
  return Response.json({ companyName: list.companyName, prices }, { headers: NEVER_CACHE });
}
