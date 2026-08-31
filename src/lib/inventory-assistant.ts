// InventoryAssistantService — LLM keyinchalik chaqira oladigan, haqiqiy
// (soxta emas) deterministik biznes funksiyalari to'plami. Har bir
// funksiya to'g'ridan-to'g'ri sof ma'lumotlar bilan ishlaydi, hech qanday
// AI yoki taxminiy natija ishlab chiqarmaydi — faqat haqiqiy hisob-kitob.

import { prisma } from "@/lib/prisma";
import { formatSum } from "@/lib/format";

const LOOKBACK_DAYS = 30;

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
  const [products, recentMoves] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      select: { id: true, name: true, stock: true },
    }),
    prisma.stockMove.findMany({
      where: {
        createdAt: { gte: daysAgo(LOOKBACK_DAYS) },
        reason: "ORDER",
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
    const avgDailyConsumption = totalConsumed / LOOKBACK_DAYS;
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
