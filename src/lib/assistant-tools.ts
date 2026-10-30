import "server-only";
import { prisma } from "@/lib/prisma";
import { can, type Permission } from "@/lib/permissions";
import type { AdminRole } from "@/lib/admin-auth";
import { salesReport, inventoryReport, supplierReport } from "@/lib/analytics";

/**
 * Read-only "tools" over real ERP data, for an AI assistant (or any script) to
 * call through /api/admin/assistant. Every tool is a deterministic query —
 * nothing is estimated or invented. Each tool declares the permission it needs,
 * so a WAREHOUSE user can't read finance numbers through the API.
 */
type Args = Record<string, unknown>;
export type AssistantTool = {
  name: string;
  description: string;
  permission: Permission;
  run: (args: Args, role: AdminRole) => Promise<unknown>;
};

const num = (v: unknown, def: number, min: number, max: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : def;
};

export const ASSISTANT_TOOLS: AssistantTool[] = [
  {
    name: "lowStock",
    description: "Mahsulotlar: qoldig'i minimal darajadan past yoki tugagan (tayyor = qoldiq − band).",
    permission: "stock.read",
    run: async () => {
      const r = await inventoryReport();
      return r.rows
        .filter((x) => x.available <= x.reorderAt)
        .sort((a, b) => a.available - b.available)
        .map((x) => ({ id: x.p.id, name: x.p.name, sku: x.p.sku, stock: x.p.stock, reserved: x.reserved, available: x.available, reorderAt: x.reorderAt }));
    },
  },
  {
    name: "reorderRecommendations",
    description: "Qayta buyurtma tavsiyalari: oylik sotuv, qoldiq necha kunga yetishi va tavsiya etilgan miqdor.",
    permission: "stock.read",
    run: async () => {
      const r = await inventoryReport();
      return r.rows
        .filter((x) => x.suggest > 0)
        .sort((a, b) => (a.daysOfStock ?? 9999) - (b.daysOfStock ?? 9999))
        .map((x) => ({ id: x.p.id, name: x.p.name, sku: x.p.sku, available: x.available, soldPerMonth: Number(x.perMonth.toFixed(1)), daysOfStock: x.daysOfStock, suggestQty: x.suggest }));
    },
  },
  {
    name: "deadStock",
    description: "O'lik ombor: qoldig'i bor, lekin 60+ kun jo'natilmagan mahsulotlar (tannarx qiymati bilan).",
    permission: "stock.read",
    run: async (_a, role) => {
      const r = await inventoryReport();
      const cost = can(role, "finance.read");
      return r.rows
        .filter((x) => x.dead)
        .sort((a, b) => b.value - a.value)
        .map((x) => ({ id: x.p.id, name: x.p.name, stock: x.p.stock, lastShipment: x.last, ...(cost ? { costValue: x.value } : {}) }));
    },
  },
  {
    name: "inventoryValue",
    description: "Ombor qiymati (tannarx), yillik aylanma va tahlil davri.",
    permission: "finance.read",
    run: async () => {
      const r = await inventoryReport();
      return { costValue: r.value, annualTurnover: Number(r.turnover.toFixed(2)), lookbackDays: r.lookback, products: r.rows.length };
    },
  },
  {
    name: "salesReport",
    description: "Savdo: tushum, tannarx, foyda, eng ko'p sotilgan mahsulotlar va mijozlar. args: { days: 7..365 } (standart 30).",
    permission: "finance.read",
    run: async (a) => {
      const r = await salesReport(num(a.days, 30, 1, 365));
      return { orders: r.orders, revenue: r.revenue, revenueNet: Math.round(r.revenueNet), cogs: r.cogs, profit: Math.round(r.profit), linesWithoutCost: r.missingCost, topProducts: r.topProducts, topCustomers: r.topCustomers };
    },
  },
  {
    name: "supplierReport",
    description: "Yetkazib beruvchilar: kirim hujjatlari bo'yicha xaridlar, o'rtacha tannarx, muddat. args: { days: 0 = hammasi } (standart 90).",
    permission: "suppliers.read",
    run: async (a, role) => {
      const r = await supplierReport(num(a.days, 90, 0, 3650));
      const cost = can(role, "finance.read");
      return r.rows.map((x) => ({ id: x.id, name: x.name, country: x.country, receipts: x.posted, cancelled: x.cancelled, units: x.units, catalogProducts: x.catalogProducts, avgLeadDays: x.avgLeadDays, lastReceipt: x.last, ...(cost ? { purchaseValue: x.value, avgUnitCost: Math.round(x.avgUnitCost) } : {}) }));
    },
  },
  {
    name: "supplierPrices",
    description: "Bitta mahsulot uchun yetkazib beruvchilar va ularning USD narxi / muddati. args: { productId } yoki { sku }.",
    permission: "suppliers.read",
    run: async (a) => {
      const where = typeof a.productId === "string" ? { id: a.productId } : typeof a.sku === "string" ? { sku: a.sku } : null;
      if (!where) throw new Error("productId yoki sku kerak.");
      const p = await prisma.product.findFirst({ where, select: { id: true, name: true, sku: true, suppliers: { include: { supplier: { select: { id: true, name: true } } } } } });
      if (!p) throw new Error("Mahsulot topilmadi.");
      return { id: p.id, name: p.name, sku: p.sku, suppliers: p.suppliers.map((s) => ({ supplierId: s.supplier.id, supplier: s.supplier.name, supplierSku: s.supplierSku, priceUsd: s.priceUsd, leadTimeDays: s.leadTimeDays })) };
    },
  },
  {
    name: "pendingOrders",
    description: "Ochiq buyurtmalar: qoralama va tasdiqlangan (hali jo'natilmagan), to'lov holati bilan.",
    permission: "orders.read",
    run: async () => {
      const orders = await prisma.order.findMany({
        where: { status: { in: ["DRAFT", "CONFIRMED"] } },
        orderBy: { createdAt: "asc" },
        take: 200,
        select: { id: true, number: true, status: true, paymentStatus: true, total: true, paidAmount: true, createdAt: true, customer: { select: { companyName: true } } },
      });
      return orders.map((o) => ({ ...o, customer: o.customer?.companyName ?? null }));
    },
  },
  {
    name: "openAlerts",
    description: "Hal qilinmagan ogohlantirishlar (kam qoldiq, tugash xavfi va h.k.).",
    permission: "stock.read",
    run: async () =>
      prisma.alert.findMany({ where: { resolvedAt: null }, orderBy: [{ severity: "desc" }, { createdAt: "desc" }], take: 200, select: { type: true, severity: true, message: true, entityType: true, entityId: true, createdAt: true } }),
  },
];

export function findTool(name: string) {
  return ASSISTANT_TOOLS.find((t) => t.name === name);
}
