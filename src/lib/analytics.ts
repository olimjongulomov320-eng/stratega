import "server-only";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { lineUnitCost } from "@/lib/sourcing";

const SALE_STATUSES = ["CONFIRMED", "SHIPPED", "COMPLETED"] as const;

export async function salesReport(days: number) {
  const since = new Date(Date.now() - days * 86400000);
  const orders = await prisma.order.findMany({
    where: { status: { in: [...SALE_STATUSES] }, confirmedAt: { gte: since } },
    include: { lines: { include: { product: true } }, customer: true },
  });
  let revenue = 0;
  let revenueNet = 0;
  let cogs = 0;
  let missingCost = 0;
  const byProduct = new Map<string, { name: string; qty: number; revenue: number; cost: number }>();
  const byCustomer = new Map<string, { name: string; orders: number; revenue: number }>();
  const byDay = new Map<string, number>();
  // Own warehouse vs supplier warehouse (bought after the sale): revenue and cost per kind, VAT included.
  const bySourcing = { OWN_STOCK: { revenue: 0, cost: 0 }, SUPPLIER_STOCK: { revenue: 0, cost: 0 } };
  for (const o of orders) {
    revenue += o.total;
    revenueNet += o.total / 1.12;
    const day = (o.confirmedAt ?? o.createdAt).toISOString().slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + o.total);
    const ck = o.customerId ?? "_none";
    const c = byCustomer.get(ck) ?? { name: o.customer?.companyName ?? "Chakana / tanlanmagan", orders: 0, revenue: 0 };
    c.orders++;
    c.revenue += o.total;
    byCustomer.set(ck, c);
    for (const l of o.lines) {
      const unitCost = lineUnitCost(l);
      const lineCost = (unitCost ?? 0) * l.quantity;
      if (!unitCost) missingCost++;
      bySourcing[l.sourcing].revenue += l.price * l.quantity;
      bySourcing[l.sourcing].cost += lineCost;
      cogs += lineCost;
      const p = byProduct.get(l.productId) ?? { name: l.product.name, qty: 0, revenue: 0, cost: 0 };
      p.qty += l.quantity;
      p.revenue += l.price * l.quantity;
      p.cost += lineCost;
      byProduct.set(l.productId, p);
    }
  }
  const products = [...byProduct.entries()].map(([id, p]) => ({ id, ...p, margin: p.revenue ? ((p.revenue / 1.12 - p.cost) / (p.revenue / 1.12)) * 100 : 0 }));
  return {
    orders: orders.length,
    revenue,
    revenueNet,
    cogs,
    profit: revenueNet - cogs,
    missingCost,
    bySourcing,
    topProducts: [...products].sort((a, b) => b.revenue - a.revenue).slice(0, 10),
    topMargin: [...products].filter((p) => p.cost > 0).sort((a, b) => b.margin - a.margin).slice(0, 10),
    topCustomers: [...byCustomer.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 10),
    byDay: [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b)),
  };
}

export async function inventoryReport() {
  const s = await getSettings();
  const lookback = Number(s["forecast.lookbackDays"]) || 90;
  const lowThreshold = Number(s["stock.lowStockThreshold"]) || 0;
  const overMult = Number(s["stock.overstockMultiplier"]) || 6;
  const since = new Date(Date.now() - lookback * 86400000);
  const [products, sales, lastSales] = await Promise.all([
    prisma.product.findMany({ where: { isActive: true }, include: { stockLevels: true, category: true } }),
    prisma.orderLine.groupBy({ by: ["productId"], where: { order: { status: { in: [...SALE_STATUSES] }, confirmedAt: { gte: since } } }, _sum: { quantity: true } }),
    prisma.stockMove.groupBy({ by: ["productId"], where: { reason: "SHIPMENT" }, _max: { createdAt: true } }),
  ]);
  const soldBy = new Map(sales.map((x) => [x.productId, x._sum.quantity ?? 0]));
  const lastBy = new Map(lastSales.map((x) => [x.productId, x._max.createdAt]));
  const deadSince = Date.now() - 60 * 86400000;
  const rows = products.map((p) => {
    const reserved = p.stockLevels.reduce((a, l) => a + l.reserved, 0);
    const sold = soldBy.get(p.id) ?? 0;
    const perMonth = (sold / lookback) * 30;
    const available = p.stock - reserved;
    const daysOfStock = sold > 0 ? Math.round(available / (sold / lookback)) : null;
    const reorderAt = Math.max(p.reorderPoint ?? 0, p.minimumStock, lowThreshold, Math.ceil(perMonth * 1.5));
    const suggest = available <= reorderAt ? Math.max(p.reorderQuantity ?? 0, Math.ceil(perMonth * 3) - available, reorderAt + 1 - available) : 0;
    const last = lastBy.get(p.id) ?? null;
    return {
      p,
      reserved,
      available,
      sold,
      perMonth,
      daysOfStock,
      reorderAt,
      suggest,
      last,
      value: p.stock * (p.costPrice ?? 0),
      dead: p.stock > 0 && (!last || last.getTime() < deadSince),
      overstock: perMonth > 0 && available > perMonth * overMult,
    };
  });
  const value = rows.reduce((a, r) => a + r.value, 0);
  const cogsLookback = rows.reduce((a, r) => a + r.sold * (r.p.costPrice ?? 0), 0);
  const turnover = value > 0 ? (cogsLookback * (365 / lookback)) / value : 0;
  return { lookback, rows, value, turnover };
}

/**
 * Purchases per supplier from posted RECEIPT documents (value = quantity × unit
 * cost), plus catalogue data from ProductSupplier (USD price, lead time).
 * `days = 0` means all time. Cancelled receipts are counted separately so the
 * completion rate shows how often a supplier delivery was voided.
 */
export async function supplierReport(days: number) {
  const since = days ? new Date(Date.now() - days * 86400000) : null;
  const [suppliers, docs] = await Promise.all([
    prisma.supplier.findMany({ include: { products: { select: { priceUsd: true, leadTimeDays: true } } } }),
    prisma.stockDocument.findMany({
      where: { type: "RECEIPT", supplierId: { not: null }, status: { in: ["POSTED", "CANCELLED"] }, ...(since ? { createdAt: { gte: since } } : {}) },
      select: { supplierId: true, status: true, postedAt: true, lines: { select: { quantity: true, unitCost: true } } },
    }),
  ]);
  const agg = new Map<string, { posted: number; cancelled: number; units: number; value: number; missingCost: number; last: Date | null }>();
  for (const d of docs) {
    const a = agg.get(d.supplierId!) ?? { posted: 0, cancelled: 0, units: 0, value: 0, missingCost: 0, last: null };
    if (d.status === "CANCELLED") a.cancelled++;
    else {
      a.posted++;
      for (const l of d.lines) {
        a.units += l.quantity;
        a.value += (l.unitCost ?? 0) * l.quantity;
        if (!l.unitCost) a.missingCost++;
      }
      if (d.postedAt && (!a.last || d.postedAt > a.last)) a.last = d.postedAt;
    }
    agg.set(d.supplierId!, a);
  }
  const rows = suppliers
    .map((s) => {
      const a = agg.get(s.id) ?? { posted: 0, cancelled: 0, units: 0, value: 0, missingCost: 0, last: null };
      const leads = s.products.map((p) => p.leadTimeDays).filter((n): n is number => n !== null);
      return {
        id: s.id,
        name: s.name,
        country: s.country,
        isActive: s.isActive,
        ...a,
        avgUnitCost: a.units ? a.value / a.units : 0,
        catalogProducts: s.products.length,
        avgLeadDays: leads.length ? Math.round(leads.reduce((x, y) => x + y, 0) / leads.length) : null,
        completion: a.posted + a.cancelled ? (a.posted / (a.posted + a.cancelled)) * 100 : null,
      };
    })
    .filter((r) => r.posted + r.cancelled > 0 || r.catalogProducts > 0)
    .sort((a, b) => b.value - a.value || b.catalogProducts - a.catalogProducts);
  const total = rows.reduce((s, r) => s + r.value, 0);
  return { rows, total, documents: rows.reduce((s, r) => s + r.posted, 0) };
}
