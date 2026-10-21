// InventoryAssistantService — LLM keyinchalik chaqira oladigan, haqiqiy
// (soxta emas) deterministik biznes funksiyalari to'plami. Har bir
// funksiya to'g'ridan-to'g'ri sof ma'lumotlar bilan ishlaydi, hech qanday
// AI yoki taxminiy natija ishlab chiqarmaydi — faqat haqiqiy hisob-kitob.

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { formatSum } from "@/lib/format";
import { getIntSetting, SETTING_KEYS } from "@/lib/settings";

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

// --- getLowStockProducts() ---
export type LowStockProduct = {
  id: string;
  name: string;
  sku: string | null;
  stock: number;
  minimumStock: number;
};

export async function getLowStockProducts(): Promise<LowStockProduct[]> {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { id: true, name: true, sku: true, stock: true, minimumStock: true },
  });
  return products
    .filter((p) => p.stock <= (p.minimumStock || 5))
    .sort((a, b) => a.stock - b.stock);
}

// --- getInventoryForecast() ---
export type InventoryForecast = {
  productId: string;
  name: string;
  currentStock: number;
  avgDailyConsumption: number;
  daysUntilStockout: number | null; // null = ma'lumot yetarli emas
};

export async function getInventoryForecast(): Promise<InventoryForecast[]> {
  const lookbackDays = await getIntSetting(SETTING_KEYS.FORECAST_LOOKBACK_DAYS);
  const safeLookback = Math.max(lookbackDays, 7);

  const [products, recentMoves] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      select: { id: true, name: true, stock: true },
    }),
    prisma.stockMove.findMany({
      where: {
        createdAt: { gte: daysAgo(safeLookback) },
        // ORDER — ariza tasdiqlanib yozilgan chiqim (eski oqim),
        // ISSUE — jo'natma/hujjat bo'yicha chiqim (yangi oqim).
        reason: { in: ["ORDER", "ISSUE"] },
        change: { lt: 0 },
      },
      select: { productId: true, change: true },
    }),
  ]);

  const consumption = new Map<string, number>();
  for (const move of recentMoves) {
    consumption.set(
      move.productId,
      (consumption.get(move.productId) ?? 0) + Math.abs(move.change)
    );
  }

  return products.map((p) => {
    const totalConsumed = consumption.get(p.id) ?? 0;
    const avgDailyConsumption = totalConsumed / safeLookback;
    const daysUntilStockout =
      avgDailyConsumption <= 0
        ? null
        : p.stock <= 0
          ? 0
          : p.stock / avgDailyConsumption;

    return {
      productId: p.id,
      name: p.name,
      currentStock: p.stock,
      avgDailyConsumption,
      daysUntilStockout,
    };
  });
}

// --- getReorderRecommendations() ---
// Reorder point = (o'rtacha kunlik sotuv x yetkazib berish muddati) + zaxira zapas.
// Agar mavjud qoldiq shu nuqtadan past bo'lsa — qayta buyurtma tavsiya etiladi.
export type ReorderRecommendation = {
  productId: string;
  name: string;
  currentStock: number;
  reorderPoint: number;
  suggestedQuantity: number;
  reason: string;
};

const DEFAULT_SAFETY_STOCK = 5;
const DEFAULT_LEAD_TIME_DAYS = 7;

export async function getReorderRecommendations(): Promise<
  ReorderRecommendation[]
> {
  const forecast = await getInventoryForecast();
  const products = await prisma.product.findMany({
    select: {
      id: true,
      reorderPoint: true,
      reorderQuantity: true,
      minimumStock: true,
    },
  });
  const productMeta = new Map(products.map((p) => [p.id, p]));

  const recommendations: ReorderRecommendation[] = [];

  for (const f of forecast) {
    const meta = productMeta.get(f.productId);
    const reorderPoint =
      meta?.reorderPoint ??
      Math.round(
        f.avgDailyConsumption * DEFAULT_LEAD_TIME_DAYS +
          (meta?.minimumStock || DEFAULT_SAFETY_STOCK)
      );

    if (f.currentStock < reorderPoint) {
      const suggestedQuantity =
        meta?.reorderQuantity ??
        Math.max(
          reorderPoint - f.currentStock,
          Math.round(f.avgDailyConsumption * DEFAULT_LEAD_TIME_DAYS)
        );

      recommendations.push({
        productId: f.productId,
        name: f.name,
        currentStock: f.currentStock,
        reorderPoint,
        suggestedQuantity: Math.max(suggestedQuantity, 1),
        reason:
          f.daysUntilStockout !== null
            ? `Taxminan ${Math.ceil(f.daysUntilStockout)} kundan keyin tugaydi`
            : "Qoldiq buyurtma nuqtasidan past",
      });
    }
  }

  return recommendations.sort((a, b) => a.currentStock - b.currentStock);
}

// --- getTopProducts() ---
export type TopProduct = {
  productId: string;
  name: string;
  unitsSold: number;
  revenue: number;
};

export async function getTopProducts(limit = 10): Promise<TopProduct[]> {
  const items = await prisma.orderItem.findMany({
    where: { order: { status: { not: "CANCELLED" } } },
    select: {
      productId: true,
      quantity: true,
      price: true,
      product: { select: { name: true } },
    },
  });

  const byProduct = new Map<string, TopProduct>();
  for (const item of items) {
    const existing = byProduct.get(item.productId);
    if (existing) {
      existing.unitsSold += item.quantity;
      existing.revenue += item.price * item.quantity;
    } else {
      byProduct.set(item.productId, {
        productId: item.productId,
        name: item.product.name,
        unitsSold: item.quantity,
        revenue: item.price * item.quantity,
      });
    }
  }

  return Array.from(byProduct.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

// --- getProductProfitability() ---
export type ProductProfitability = {
  productId: string;
  name: string;
  revenue: number;
  cost: number;
  grossProfit: number;
  marginPercent: number;
};

export async function getProductProfitability(
  limit = 10
): Promise<ProductProfitability[]> {
  const items = await prisma.orderItem.findMany({
    where: { order: { status: { not: "CANCELLED" } } },
    select: {
      productId: true,
      quantity: true,
      price: true,
      costPrice: true,
      product: { select: { name: true } },
    },
  });

  const byProduct = new Map<string, ProductProfitability>();
  for (const item of items) {
    const revenue = item.price * item.quantity;
    const cost = (item.costPrice ?? 0) * item.quantity;
    const existing = byProduct.get(item.productId);
    if (existing) {
      existing.revenue += revenue;
      existing.cost += cost;
    } else {
      byProduct.set(item.productId, {
        productId: item.productId,
        name: item.product.name,
        revenue,
        cost,
        grossProfit: 0,
        marginPercent: 0,
      });
    }
  }

  return Array.from(byProduct.values())
    .map((p) => {
      const grossProfit = p.revenue - p.cost;
      const marginPercent = p.revenue > 0 ? (grossProfit / p.revenue) * 100 : 0;
      return { ...p, grossProfit, marginPercent };
    })
    .sort((a, b) => b.marginPercent - a.marginPercent)
    .slice(0, limit);
}

// --- getSupplierPrices() ---
export type SupplierPrice = {
  supplierId: string;
  supplierName: string;
  costPrice: number | null;
  leadTimeDays: number | null;
};

export async function getSupplierPrices(
  productId: string
): Promise<SupplierPrice[]> {
  const rows = await prisma.supplierProduct.findMany({
    where: { productId },
    include: { supplier: { select: { id: true, name: true } } },
    orderBy: { costPrice: "asc" },
  });

  return rows.map((r) => ({
    supplierId: r.supplier.id,
    supplierName: r.supplier.name,
    costPrice: r.costPrice,
    leadTimeDays: r.leadTimeDays,
  }));
}

// --- getPendingOrders() ---
export type PendingOrder = {
  orderId: string;
  number: string;
  customerName: string | null;
  status: string;
  total: number;
};

export async function getPendingOrders(): Promise<PendingOrder[]> {
  const orders = await prisma.order.findMany({
    where: { status: { in: ["DRAFT", "CONFIRMED", "PROCESSING", "READY_TO_SHIP"] } },
    include: {
      customer: { select: { companyName: true } },
      items: { select: { price: true, quantity: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return orders.map((o) => ({
    orderId: o.id,
    number: o.number,
    customerName: o.customer?.companyName ?? null,
    status: o.status,
    total: o.items.reduce((s, i) => s + i.price * i.quantity, 0),
  }));
}

// --- getInventoryValue() ---
export type InventoryValueSummary = {
  totalValue: number;
  totalValueFormatted: string;
  totalUnits: number;
  productCount: number;
  byCategory: { categoryName: string; value: number }[];
};

export async function getInventoryValue(): Promise<InventoryValueSummary> {
  const products = await prisma.product.findMany({
    select: {
      stock: true,
      price: true,
      category: { select: { name: true } },
    },
  });

  const totalValue = products.reduce((s, p) => s + p.stock * p.price, 0);
  const totalUnits = products.reduce((s, p) => s + p.stock, 0);

  const byCategoryMap = new Map<string, number>();
  for (const p of products) {
    byCategoryMap.set(
      p.category.name,
      (byCategoryMap.get(p.category.name) ?? 0) + p.stock * p.price
    );
  }

  return {
    totalValue,
    totalValueFormatted: formatSum(totalValue),
    totalUnits,
    productCount: products.length,
    byCategory: Array.from(byCategoryMap.entries())
      .map(([categoryName, value]) => ({ categoryName, value }))
      .sort((a, b) => b.value - a.value),
  };
}

// --- getTodaysProblems() ---
// Kunlik "diqqat talab qiladigan" muammolarni bitta joyga jamlaydi:
// tugagan mahsulotlar, tez orada tugaydiganlar va kutilayotgan
// buyurtmalar soni.
export type TodaysProblems = {
  outOfStockCount: number;
  runningOutSoonCount: number; // 7 kun ichida tugaydi
  pendingOrderCount: number;
  reorderRecommendationCount: number;
};

export async function getTodaysProblems(): Promise<TodaysProblems> {
  const [forecast, pendingOrders, reorderRecs] = await Promise.all([
    getInventoryForecast(),
    getPendingOrders(),
    getReorderRecommendations(),
  ]);

  return {
    outOfStockCount: forecast.filter((f) => f.currentStock <= 0).length,
    runningOutSoonCount: forecast.filter(
      (f) => f.daysUntilStockout !== null && f.daysUntilStockout <= 7 && f.currentStock > 0
    ).length,
    pendingOrderCount: pendingOrders.length,
    reorderRecommendationCount: reorderRecs.length,
  };
}

// ============================================================
// Savdo / moliya tahlili (boshqaruv paneli va hisobotlar uchun)
// ============================================================

export type SalesFilters = {
  from?: Date | null;
  to?: Date | null;
  productId?: string | null;
  categoryId?: string | null;
  customerId?: string | null;
  warehouseId?: string | null;
};

export type RevenueReport = {
  revenue: number;
  cogs: number;
  grossProfit: number;
  marginPercent: number;
  orderCount: number;
  averageOrderValue: number;
};

function orderItemWhere(filters: SalesFilters): Prisma.OrderItemWhereInput {
  const orderWhere: Prisma.OrderWhereInput = {
    status: { notIn: ["DRAFT", "CANCELLED"] },
  };
  if (filters.customerId) orderWhere.customerId = filters.customerId;
  if (filters.warehouseId) orderWhere.warehouseId = filters.warehouseId;
  if (filters.from || filters.to) {
    orderWhere.createdAt = {
      ...(filters.from ? { gte: filters.from } : {}),
      ...(filters.to ? { lte: filters.to } : {}),
    };
  }

  return {
    order: orderWhere,
    ...(filters.productId ? { productId: filters.productId } : {}),
    ...(filters.categoryId
      ? { product: { categoryId: filters.categoryId } }
      : {}),
  };
}

// --- getRevenueReport() ---
export async function getRevenueReport(
  filters: SalesFilters = {}
): Promise<RevenueReport> {
  const items = await prisma.orderItem.findMany({
    where: orderItemWhere(filters),
    select: { quantity: true, price: true, costPrice: true, orderId: true },
  });

  let revenue = 0;
  let cogs = 0;
  const orderIds = new Set<string>();
  for (const item of items) {
    revenue += item.price * item.quantity;
    cogs += (item.costPrice ?? 0) * item.quantity;
    orderIds.add(item.orderId);
  }

  const grossProfit = revenue - cogs;
  return {
    revenue,
    cogs,
    grossProfit,
    marginPercent: revenue > 0 ? (grossProfit / revenue) * 100 : 0,
    orderCount: orderIds.size,
    averageOrderValue: orderIds.size > 0 ? revenue / orderIds.size : 0,
  };
}

// --- getTopCustomers() ---
export type TopCustomer = {
  customerId: string | null;
  companyName: string;
  orders: number;
  revenue: number;
};

export async function getTopCustomers(limit = 10, filters: SalesFilters = {}): Promise<TopCustomer[]> {
  const items = await prisma.orderItem.findMany({
    where: orderItemWhere(filters),
    select: {
      quantity: true,
      price: true,
      order: {
        select: {
          id: true,
          customerId: true,
          customer: { select: { companyName: true } },
        },
      },
    },
  });

  const byCustomer = new Map<string, TopCustomer>();
  const orderSetByCustomer = new Map<string, Set<string>>();
  for (const item of items) {
    const key = item.order.customerId ?? "no-customer";
    const existing = byCustomer.get(key);
    if (existing) {
      existing.revenue += item.price * item.quantity;
    } else {
      byCustomer.set(key, {
        customerId: item.order.customerId,
        companyName: item.order.customer?.companyName ?? "Mijozsiz buyurtmalar",
        orders: 0,
        revenue: item.price * item.quantity,
      });
      orderSetByCustomer.set(key, new Set());
    }
    orderSetByCustomer.get(key)!.add(item.order.id);
  }
  for (const [key, orders] of orderSetByCustomer) {
    byCustomer.get(key)!.orders = orders.size;
  }

  return Array.from(byCustomer.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

// --- getSalesByPeriod() ---
export type PeriodSales = {
  today: { revenue: number; orders: number };
  week: { revenue: number; orders: number };
  month: { revenue: number; orders: number };
};

export async function getSalesByPeriod(): Promise<PeriodSales> {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfDay.getTime() - ((startOfDay.getDay() + 6) % 7) * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [todayReport, weekReport, monthReport] = await Promise.all([
    getRevenueReport({ from: startOfDay }),
    getRevenueReport({ from: startOfWeek }),
    getRevenueReport({ from: startOfMonth }),
  ]);

  return {
    today: { revenue: todayReport.revenue, orders: todayReport.orderCount },
    week: { revenue: weekReport.revenue, orders: weekReport.orderCount },
    month: { revenue: monthReport.revenue, orders: monthReport.orderCount },
  };
}

// --- getDeadStock() ---
// O'lik ombor: qoldiq bor, lekin ko'rsatilgan davrda bironta ham sotuv yo'q.
export type DeadStockItem = {
  productId: string;
  name: string;
  stock: number;
  value: number;
  lastSoldAt: Date | null;
};

export async function getDeadStock(minIdleDays = 60, limit = 50): Promise<DeadStockItem[]> {
  const cutoff = daysAgo(minIdleDays);
  const products = await prisma.product.findMany({
    where: { isActive: true, stock: { gt: 0 } },
    select: {
      id: true,
      name: true,
      stock: true,
      price: true,
      stockMoves: {
        where: { reason: { in: ["ORDER", "ISSUE"] }, change: { lt: 0 } },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true },
      },
    },
  });

  return products
    .filter((p) => p.stockMoves.length === 0 || p.stockMoves[0]!.createdAt < cutoff)
    .map((p) => ({
      productId: p.id,
      name: p.name,
      stock: p.stock,
      value: p.stock * p.price,
      lastSoldAt: p.stockMoves[0]?.createdAt ?? null,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

// --- getTurnover() ---
export type TurnoverReport = {
  cogs: number;
  averageInventoryValue: number;
  turnover: number; // yillik aylanma (COGS / o'rtacha ombor)
  daysOfStock: number | null;
};

export async function getTurnover(days = 90): Promise<TurnoverReport> {
  const report = await getRevenueReport({ from: daysAgo(days) });
  const products = await prisma.product.findMany({
    select: { stock: true, price: true },
  });
  const inventoryValue = products.reduce((s, p) => s + p.stock * p.price, 0);
  const annualization = 365 / Math.max(days, 1);

  return {
    cogs: report.cogs,
    averageInventoryValue: inventoryValue,
    turnover: inventoryValue > 0 ? (report.cogs / inventoryValue) * annualization : 0,
    daysOfStock: report.cogs > 0 ? inventoryValue / (report.cogs / Math.max(days, 1)) : null,
  };
}

// ============================================================
// AI yordamchi uchun vosita reyestri (LLM chaqira oladigan tool'lar)
// Har bir vosita — haqiqiy deterministik funksiya. Soxta javob yo'q.
// ============================================================

export type AssistantTool = {
  name: string;
  description: string;
  execute: (args: Record<string, unknown>) => Promise<unknown>;
};

export const ASSISTANT_TOOLS: AssistantTool[] = [
  {
    name: "getLowStockProducts",
    description: "Kam qolgan (minimumStock dan past) mahsulotlar ro'yxati.",
    execute: () => getLowStockProducts(),
  },
  {
    name: "getInventoryForecast",
    description:
      "Har bir mahsulot uchun kunlik sotuv sur'ati va qoldiq tugash muddati (kunlar).",
    execute: () => getInventoryForecast(),
  },
  {
    name: "getReorderRecommendations",
    description:
      "Qayta buyurtma tavsiyalari: reorder point, tavsiya etilgan miqdor va sabab.",
    execute: () => getReorderRecommendations(),
  },
  {
    name: "getTopProducts",
    description: "Eng ko'p sotilgan mahsulotlar (dona va tushum bo'yicha).",
    execute: (args) => getTopProducts(Number(args.limit) || 10),
  },
  {
    name: "getProductProfitability",
    description: "Mahsulotlar bo'yicha tushum, tannarx, yalpi foyda va marja.",
    execute: (args) => getProductProfitability(Number(args.limit) || 10),
  },
  {
    name: "getSupplierPrices",
    description:
      "Berilgan mahsulot uchun yetkazib beruvchilar narxlari (arzonlisidan boshlab). args: { productId }",
    execute: (args) => getSupplierPrices(String(args.productId ?? "")),
  },
  {
    name: "getPendingOrders",
    description: "Kutilayotgan (yakunlanmagan) buyurtmalar ro'yxati.",
    execute: () => getPendingOrders(),
  },
  {
    name: "getInventoryValue",
    description:
      "Jami ombor qiymati: umumiy, birliklar soni va kategoriyalar bo'yicha.",
    execute: () => getInventoryValue(),
  },
  {
    name: "getRevenueReport",
    description:
      "Savdo hisoboti: tushum, COGS, yalpi foyda, marja, buyurtmalar soni. args: { from?, to?, customerId?, productId? } (ISO sana)",
    execute: (args) =>
      getRevenueReport({
        from: args.from ? new Date(String(args.from)) : null,
        to: args.to ? new Date(String(args.to)) : null,
        customerId: args.customerId ? String(args.customerId) : null,
        productId: args.productId ? String(args.productId) : null,
      }),
  },
  {
    name: "getTopCustomers",
    description: "Eng ko'p tushum keltirgan mijozlar.",
    execute: (args) => getTopCustomers(Number(args.limit) || 10),
  },
  {
    name: "getDeadStock",
    description:
      "O'lik ombor: sotuvi bo'lmagan, lekin qoldiq bor mahsulotlar (qiymat bo'yicha).",
    execute: (args) => getDeadStock(Number(args.minIdleDays) || 60),
  },
  {
    name: "getTurnover",
    description: "Ombor aylanmasi (yillik) va o'rtacha qoldiq yetarli kunlar.",
    execute: (args) => getTurnover(Number(args.days) || 90),
  },
  {
    name: "getTodaysProblems",
    description:
      "Bugungi muhim muammolar: tugaganlar, tez tugaydiganlar, kutilayotgan buyurtmalar, qayta buyurtma tavsiyalari.",
    execute: () => getTodaysProblems(),
  },
];

export function getAssistantTool(name: string): AssistantTool | undefined {
  return ASSISTANT_TOOLS.find((t) => t.name === name);
}
