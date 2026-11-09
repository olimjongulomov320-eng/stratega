import "server-only";
import { prisma } from "@/lib/prisma";

const SOLD = ["CONFIRMED", "SHIPPED", "COMPLETED"] as const;

/**
 * Supplier-warehouse items sold to buyers: what still has to be bought (by supplier) and what was bought recently.
 * A line counts once its order is confirmed; cancelled orders drop out.
 */
export async function supplierPurchases(days = 30) {
  const since = new Date(Date.now() - days * 86400000);
  const include = {
    product: { select: { name: true, sku: true } },
    supplier: { select: { id: true, name: true } },
    order: { select: { id: true, number: true, confirmedAt: true, customer: { select: { companyName: true } } } },
  } as const;
  const [toBuy, bought] = await Promise.all([
    prisma.orderLine.findMany({
      where: { sourcing: "SUPPLIER_STOCK", purchasedAt: null, order: { status: { in: [...SOLD] } } },
      include,
      orderBy: { order: { confirmedAt: "asc" } },
    }),
    prisma.orderLine.findMany({
      where: { sourcing: "SUPPLIER_STOCK", purchasedAt: { gte: since } },
      include,
      orderBy: { purchasedAt: "desc" },
    }),
  ]);
  const groups = new Map<string, { supplier: string; lines: typeof toBuy; estimated: number }>();
  for (const l of toBuy) {
    const key = l.supplier?.id ?? "_none";
    const g = groups.get(key) ?? { supplier: l.supplier?.name ?? "Ta'minotchi tanlanmagan", lines: [], estimated: 0 };
    g.lines.push(l);
    g.estimated += (l.costPrice ?? 0) * l.quantity;
    groups.set(key, g);
  }
  const paid = bought.reduce((s, l) => s + (l.purchaseCost ?? 0) * l.quantity, 0);
  const margin = bought.reduce((s, l) => s + (l.price - (l.purchaseCost ?? 0)) * l.quantity, 0);
  return { toBuy: [...groups.values()], bought, paid, margin };
}
