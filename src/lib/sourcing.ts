import type { Prisma, ProductSourcing } from "@/generated/prisma/client";

// Two kinds of products (see Product.sourcing):
// - OWN_STOCK: in our warehouse; the stock ledger counts it and orders reserve it.
// - SUPPLIER_STOCK: bought from a supplier's local warehouse right after each sale (back-to-back). It never enters
//   our ledger, is always available to buyers, and its real purchase cost is recorded per order line.

/** Whether buyers can order a product now. */
export function isAvailable(p: { stock: number; sourcing?: ProductSourcing | null }): boolean {
  return p.sourcing === "SUPPLIER_STOCK" || p.stock > 0;
}

/** The "in stock only" catalogue filter. */
export const availableWhere: Prisma.ProductWhereInput = { OR: [{ stock: { gt: 0 } }, { sourcing: "SUPPLIER_STOCK" }] };

/** Cost of an order line for margins: the price actually paid to the supplier when recorded, else the snapshot. */
export function lineUnitCost(l: { purchaseCost?: number | null; costPrice?: number | null }): number | null {
  return l.purchaseCost ?? l.costPrice ?? null;
}

/** Accepts the import column values "o'z ombori" / "ta'minotchi" (and ru/en). Unknown text gives undefined. */
export function parseSourcing(value: string): ProductSourcing | undefined {
  const v = value.trim().toLowerCase();
  if (!v) return undefined;
  if (/^(own|o'?z|o‘z|свой|собств|own_stock)/.test(v)) return "OWN_STOCK";
  if (/^(supplier|ta'?minotchi|ta‘minotchi|постав|склад постав|supplier_stock|hamkor)/.test(v)) return "SUPPLIER_STOCK";
  return undefined;
}
