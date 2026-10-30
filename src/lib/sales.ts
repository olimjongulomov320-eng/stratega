import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { Line } from "@/lib/lines";

type Db = Prisma.TransactionClient | typeof prisma;

/** Price for a customer: their price list if it has the product, else the retail price. */
export async function resolvePrices(db: Db, customerId: string | null, lines: Line[]) {
  const products = await db.product.findMany({ where: { id: { in: lines.map((l) => l.productId) } } });
  const byId = new Map(products.map((p) => [p.id, p]));
  let listPrices = new Map<string, number>();
  if (customerId) {
    const customer = await db.customer.findUnique({ where: { id: customerId }, include: { priceList: { include: { items: true } } } });
    if (customer?.priceList) listPrices = new Map(customer.priceList.items.map((i) => [i.productId, i.price]));
  }
  return lines.map((l) => {
    const p = byId.get(l.productId);
    if (!p) throw new Error("Mahsulot topilmadi.");
    const price = l.price ?? listPrices.get(p.id) ?? p.price;
    return { productId: p.id, quantity: l.quantity, price, costPrice: p.costPrice };
  });
}

/** Find a customer by phone, or create one from RFQ details. */
export async function customerFromRfq(db: Db, rfq: { companyName: string; contactName: string; phone: string }) {
  const digits = rfq.phone.replace(/\D/g, "").slice(-9);
  if (digits.length === 9) {
    const candidates = await db.customer.findMany({ where: { phone: { not: null } } });
    const existing = candidates.find((c) => (c.phone ?? "").replace(/\D/g, "").endsWith(digits));
    if (existing) return existing;
  }
  return db.customer.create({ data: { companyName: rfq.companyName, contactName: rfq.contactName, phone: rfq.phone } });
}
