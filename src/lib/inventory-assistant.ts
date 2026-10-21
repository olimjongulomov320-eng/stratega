// InventoryAssistantService — LLM keyinchalik chaqira oladigan, haqiqiy
// (soxta emas) deterministik biznes funksiyalari to'plami. Har bir
// funksiya to'g'ridan-to'g'ri sof ma'lumotlar bilan ishlaydi, hech qanday
// AI yoki taxminiy natija ishlab chiqarmaydi — faqat haqiqiy hisob-kitob.

import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { formatSum } from "@/lib/format";
import { getIntSetting, SETTING_KEYS } from "@/lib/settings";

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

/** Tizim sozlamasidagi "kam qoldiq" chegarasi (zaxira bo'lmasa — 5). */
export async function getLowStockThreshold(): Promise<number> {
  const value = await getIntSetting(SETTING_KEYS.LOW_STOCK_THRESHOLD);
  return Number.isFinite(value) && value > 0 ? value : 5;
}

/**
 * Mahsulotning "kam qoldiq" chegarasi:
 * 1) mahsulotning o'z minimumStock qiymati (agar belgilangan bo'lsa);
 * 2) aks holda tizim sozlamasi (stock.lowStockThreshold).
 */
export function effectiveLowStockThreshold(
  minimumStock: number | null | undefined,
  globalThreshold: number
): number {
  if (typeof minimumStock === "number" && minimumStock > 0) return minimumStock;
  return globalThreshold;
}

// --- getLowStockProducts() ---
export type LowStockProduct = {
  id: string;
  name: string;
  sku: string | null;
  stock: number;
  minimumStock: number;
  isOutOfStock: boolean;
};

export async function getLowStockProducts(): Promise<LowStockProduct[]> {
  const globalThreshold = await getLowStockThreshold();

  // Jami qoldiq — Stock jadvalidan (asl haqiqat manbai), Product.stock
  // emas (u denormalizatsiya bo'lib, kechikishi mumkin).
  const rows = await prisma.$queryRaw<
    {
      id: string;
      name: string;
      sku: string | null;
      quantity: number;
      minimumStock: number;
    }[]
  >`
    SELECT p."id", p."name", p."sku", p."minimumStock",
           COALESCE(SUM(s."quantity"), 0)::int AS quantity
    FROM "Product" p
    LEFT JOIN "Stock" s ON s."productId" = p."id"
    WHERE p."isActive" = true
    GROUP BY p."id", p."name", p."sku", p."minimumStock"
  `;

  return rows
    .map((r) => ({
      id: r.id,
      name: r.name,
      sku: r.sku,
      stock: Number(r.quantity),
      minimumStock: effectiveLowStockThreshold(r.minimumStock, globalThreshold),
      isOutOfStock: Number(r.quantity) <= 0,
    }))
    .filter((p) => p.stock <= p.minimumStock)
    .sort((a, b) => a.stock - b.stock);
}

// --- getInventoryForecast() ---
export type InventoryForecast = {
  productId: string;
  name: string;
  currentStock: number;
  reserved: number;
  avgDailyConsumption: number;
  daysUntilStockout: number | null; // null = ma'lumot yetarli emas
};

export async function getInventoryForecast(): Promise<InventoryForecast[]> {
  const lookbackDays = await getIntSetting(SETTING_KEYS.FORECAST_LOOKBACK_DAYS);
  const safeLookback = Math.max(lookbackDays, 7);
  const since = daysAgo(safeLookback);

  // Bitta SQL bilan: jami qoldiq (Stock), band (reserved) va iste'mol
  // (StockMove). Har bir qator uchun alohida so'rov yuborish N+1
  // muammosini keltirib chiqardi.
  //
  //Muhim: FAOL bo'lmagan mahsulotlar ham ro'yxatga olinadi — qoldig'i
  // tugagach tizim ularni avtomatik "nofaol" qiladi (Product.isActive=false).
  // Faqat faol mahsulotlarni olsa, "tugagan" ogohlantirishlari umuman
  // chiqmasdi. Shuning uchun: faol YOKI omborda qoldig'i bor.
  const rows = await prisma.$queryRaw<
    {
      productId: string;
      name: string;
      quantity: number;
      reserved: number;
      consumed: number;
    }[]
  >`
    WITH stock AS (
      SELECT "productId",
             SUM("quantity")::int AS qty,
             SUM("reserved")::int AS res
      FROM "Stock"
      GROUP BY "productId"
    ),
    consumption AS (
      SELECT "productId", SUM(ABS("change"))::int AS consumed
      FROM "StockMove"
      WHERE "createdAt" >= ${since}
        AND "reason" IN ('ORDER', 'ISSUE')
        AND "change" < 0
      GROUP BY "productId"
    )
    SELECT p."id" AS "productId",
           p."name",
           COALESCE(s.qty, 0)::int AS quantity,
           COALESCE(s.res, 0)::int AS reserved,
           COALESCE(c.consumed, 0)::int AS consumed
    FROM "Product" p
    LEFT JOIN stock s ON s."productId" = p."id"
    LEFT JOIN consumption c ON c."productId" = p."id"
    WHERE p."isActive" = true
       OR s."productId" IS NOT NULL
  `;

  return rows.map((r) => {
    const currentStock = Number(r.quantity);
    const totalConsumed = Number(r.consumed);
    const avgDailyConsumption = totalConsumed / safeLookback;
    const daysUntilStockout =
      avgDailyConsumption <= 0
        ? null
        : currentStock <= 0
          ? 0
          : currentStock / avgDailyConsumption;

    return {
      productId: r.productId,
      name: r.name,
      currentStock,
      reserved: Number(r.reserved),
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
  // DB da agregatsiya — barcha buyurtma qatorlarini JS ga tortib
  // guruhlash o'rniga. Natija bir xil, ammo jami satrlar yuklanmaydi.
  const rows = await prisma.$queryRaw<
    { productId: string; name: string; units: number; revenue: number }[]
  >`
    SELECT oi."productId",
           p."name",
           SUM(oi."quantity")::int AS units,
           SUM(oi."price" * oi."quantity")::bigint AS revenue
    FROM "OrderItem" oi
    JOIN "Order" o ON o."id" = oi."orderId"
    JOIN "Product" p ON p."id" = oi."productId"
    WHERE o."status" NOT IN ('DRAFT', 'CANCELLED')
    GROUP BY oi."productId", p."name"
    ORDER BY revenue DESC
    LIMIT ${limit}
  `;

  return rows.map((r) => ({
    productId: r.productId,
    name: r.name,
    unitsSold: Number(r.units),
    revenue: Number(r.revenue),
  }));
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
  const rows = await prisma.$queryRaw<
    {
      productId: string;
      name: string;
      revenue: number;
      cost: number;
    }[]
  >`
    SELECT oi."productId",
           p."name",
           SUM(oi."price" * oi."quantity")::bigint AS revenue,
           SUM(COALESCE(oi."costPrice", 0) * oi."quantity")::bigint AS cost
    FROM "OrderItem" oi
    JOIN "Order" o ON o."id" = oi."orderId"
    JOIN "Product" p ON p."id" = oi."productId"
    WHERE o."status" NOT IN ('DRAFT', 'CANCELLED')
    GROUP BY oi."productId", p."name"
  `;

  return rows
    .map((r) => {
      const revenue = Number(r.revenue);
      const cost = Number(r.cost);
      const grossProfit = revenue - cost;
      const marginPercent = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
      return {
        productId: r.productId,
        name: r.name,
        revenue,
        cost,
        grossProfit,
        marginPercent,
      };
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
  const rows = await prisma.$queryRaw<
    {
      orderId: string;
      number: string;
      customerName: string | null;
      status: string;
      total: number;
    }[]
  >`
    SELECT o."id" AS "orderId",
           o."number",
           c."companyName" AS "customerName",
           o."status",
           COALESCE(SUM(oi."price" * oi."quantity"), 0)::bigint AS total
    FROM "Order" o
    LEFT JOIN "Customer" c ON c."id" = o."customerId"
    LEFT JOIN "OrderItem" oi ON oi."orderId" = o."id"
    WHERE o."status" IN ('DRAFT', 'CONFIRMED', 'PROCESSING', 'READY_TO_SHIP')
    GROUP BY o."id", o."number", c."companyName", o."status", o."createdAt"
    ORDER BY o."createdAt" ASC
  `;

  return rows.map((r) => ({
    orderId: r.orderId,
    number: r.number,
    customerName: r.customerName ?? null,
    status: r.status,
    total: Number(r.total),
  }));
}

// --- getInventoryValue() ---
export type InventoryValueSummary = {
  totalValue: number; // tannarx (costPrice) bo'yicha — kapital qanchaga tushgan
  totalRetailValue: number; // sotuv narxi bo'yicha — potensial tushum
  totalValueFormatted: string;
  totalUnits: number;
  productCount: number;
  reservedUnits: number;
  byCategory: { categoryName: string; value: number }[];
};

export async function getInventoryValue(): Promise<InventoryValueSummary> {
  // Qiymat TANNARX (costPrice) bo'yicha hisoblanadi — omborga bog'langan
  // kapital. Sotuv narxi ("retail value") alohida ko'rsatiladi.
  // Qiymat Stock jadvalidan olinadi (asl haqiqat manbai).
  const rows = await prisma.$queryRaw<
    {
      categoryName: string;
      units: number;
      reserved: number;
      costValue: number;
      retailValue: number;
      products: number;
    }[]
  >`
    SELECT c."name" AS "categoryName",
           SUM(s."quantity")::int AS units,
           SUM(s."reserved")::int AS reserved,
           SUM(s."quantity" * COALESCE(p."costPrice", p."price"))::bigint AS "costValue",
           SUM(s."quantity" * p."price")::bigint AS "retailValue",
           COUNT(DISTINCT p."id")::int AS products
    FROM "Stock" s
    JOIN "Product" p ON p."id" = s."productId"
    JOIN "Category" c ON c."id" = p."categoryId"
    GROUP BY c."name"
  `;

  const totalValue = rows.reduce((s, r) => s + Number(r.costValue), 0);
  const totalRetailValue = rows.reduce((s, r) => s + Number(r.retailValue), 0);
  const totalUnits = rows.reduce((s, r) => s + Number(r.units), 0);
  const reservedUnits = rows.reduce((s, r) => s + Number(r.reserved), 0);
  const productCount = rows.reduce((s, r) => s + Number(r.products), 0);

  return {
    totalValue,
    totalRetailValue,
    totalValueFormatted: formatSum(totalValue),
    totalUnits,
    productCount,
    reservedUnits,
    byCategory: rows
      .map((r) => ({ categoryName: r.categoryName, value: Number(r.costValue) }))
      .sort((a, b) => b.value - a.value),
  };
}

// ============================================================
// Boshqaruv paneli uchun jamlangan ombor ko'rsatkichlari
// ============================================================

export type StockSummary = {
  productCount: number;
  warehouseCount: number;
  totalUnits: number;
  reservedUnits: number;
  availableUnits: number;
  totalValue: number; // tannarx bo'yicha
  totalRetailValue: number; // sotuv narxi bo'yicha
  outOfStockCount: number;
  lowStockCount: number;
  overstockCount: number;
};

/**
 * Bitta SQL bilan ombor ko'rsatkichlari — boshqaruv paneli uchun.
 * Barcha mahsulotlar JS ga yuklanmaydi (faqat agregatlar).
 */
export async function getStockSummary(): Promise<StockSummary> {
  const [globalThreshold, overstockMultiplier] = await Promise.all([
    getLowStockThreshold(),
    getIntSetting(SETTING_KEYS.OVERSTOCK_MULTIPLIER),
  ]);
  const overstockLevel = globalThreshold * Math.max(overstockMultiplier, 1);

  const rows = await prisma.$queryRaw<
    {
      productCount: number;
      totalUnits: number;
      reservedUnits: number;
      totalValue: number;
      totalRetailValue: number;
      outOfStockCount: number;
      lowStockCount: number;
      overstockCount: number;
    }[]
  >`
    WITH stock AS (
      SELECT "productId",
             SUM("quantity")::int AS qty,
             SUM("reserved")::int AS res
      FROM "Stock"
      GROUP BY "productId"
    )
    SELECT COUNT(*)::int AS "productCount",
           COALESCE(SUM(s.qty), 0)::int AS "totalUnits",
           COALESCE(SUM(s.res), 0)::int AS "reservedUnits",
           COALESCE(SUM(s.qty * COALESCE(p."costPrice", p."price")), 0)::bigint AS "totalValue",
           COALESCE(SUM(s.qty * p."price"), 0)::bigint AS "totalRetailValue",
           COUNT(*) FILTER (WHERE s.qty <= 0)::int AS "outOfStockCount",
           COUNT(*) FILTER (
             WHERE s.qty > 0
               AND s.qty <= CASE
                     WHEN p."minimumStock" > 0 THEN p."minimumStock"
                     ELSE ${globalThreshold}
                   END
           )::int AS "lowStockCount",
           COUNT(*) FILTER (WHERE s.qty > ${overstockLevel})::int AS "overstockCount"
    FROM stock s
    JOIN "Product" p ON p."id" = s."productId"
  `;

  const row = rows[0];
  const totalUnits = Number(row?.totalUnits ?? 0);
  const reservedUnits = Number(row?.reservedUnits ?? 0);

  const warehouseCount = await prisma.warehouse.count({ where: { isActive: true } });

  return {
    productCount: Number(row?.productCount ?? 0),
    warehouseCount,
    totalUnits,
    reservedUnits,
    availableUnits: totalUnits - reservedUnits,
    totalValue: Number(row?.totalValue ?? 0),
    totalRetailValue: Number(row?.totalRetailValue ?? 0),
    outOfStockCount: Number(row?.outOfStockCount ?? 0),
    lowStockCount: Number(row?.lowStockCount ?? 0),
    overstockCount: Number(row?.overstockCount ?? 0),
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

/**
 * Savdo filtrlarini SQL shartiga aylantiradi. Barcha qiymatlar
 * parametr sifatida yuboriladi (SQL injection'dan himoyalangan).
 */
function salesWhereSql(filters: SalesFilters): Prisma.Sql {
  const parts: Prisma.Sql[] = [
    Prisma.sql`o."status" NOT IN ('DRAFT', 'CANCELLED')`,
  ];
  if (filters.customerId) {
    parts.push(Prisma.sql`o."customerId" = ${filters.customerId}`);
  }
  if (filters.warehouseId) {
    parts.push(Prisma.sql`o."warehouseId" = ${filters.warehouseId}`);
  }
  if (filters.from) {
    parts.push(Prisma.sql`o."createdAt" >= ${filters.from}`);
  }
  if (filters.to) {
    parts.push(Prisma.sql`o."createdAt" <= ${filters.to}`);
  }
  if (filters.productId) {
    parts.push(Prisma.sql`oi."productId" = ${filters.productId}`);
  }
  if (filters.categoryId) {
    parts.push(Prisma.sql`p."categoryId" = ${filters.categoryId}`);
  }
  return Prisma.join(parts, " AND ");
}

// --- getRevenueReport() ---
export async function getRevenueReport(
  filters: SalesFilters = {}
): Promise<RevenueReport> {
  const where = salesWhereSql(filters);

  const rows = await prisma.$queryRaw<
    { revenue: number | null; cogs: number | null; orders: number }[]
  >`
    SELECT SUM(oi."price" * oi."quantity")::bigint AS revenue,
           SUM(COALESCE(oi."costPrice", 0) * oi."quantity")::bigint AS cogs,
           COUNT(DISTINCT o."id")::int AS orders
    FROM "OrderItem" oi
    JOIN "Order" o ON o."id" = oi."orderId"
    JOIN "Product" p ON p."id" = oi."productId"
    WHERE ${where}
  `;

  const revenue = Number(rows[0]?.revenue ?? 0);
  const cogs = Number(rows[0]?.cogs ?? 0);
  const orderCount = Number(rows[0]?.orders ?? 0);
  const grossProfit = revenue - cogs;

  return {
    revenue,
    cogs,
    grossProfit,
    marginPercent: revenue > 0 ? (grossProfit / revenue) * 100 : 0,
    orderCount,
    averageOrderValue: orderCount > 0 ? revenue / orderCount : 0,
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
  const where = salesWhereSql(filters);

  const rows = await prisma.$queryRaw<
    {
      customerId: string | null;
      companyName: string | null;
      orders: number;
      revenue: number;
    }[]
  >`
    SELECT o."customerId",
           c."companyName",
           COUNT(DISTINCT o."id")::int AS orders,
           SUM(oi."price" * oi."quantity")::bigint AS revenue
    FROM "OrderItem" oi
    JOIN "Order" o ON o."id" = oi."orderId"
    JOIN "Product" p ON p."id" = oi."productId"
    LEFT JOIN "Customer" c ON c."id" = o."customerId"
    WHERE ${where}
    GROUP BY o."customerId", c."companyName"
    ORDER BY revenue DESC
    LIMIT ${limit}
  `;

  return rows.map((r) => ({
    customerId: r.customerId,
    companyName: r.companyName ?? "Mijozsiz buyurtmalar",
    orders: Number(r.orders),
    revenue: Number(r.revenue),
  }));
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

  // Chiqim harakati bo'lgan mahsulotlar — ular "sotilgan" hisoblanadi.
  const soldRows = await prisma.$queryRaw<
    { productId: string; lastSoldAt: Date }[]
  >`
    SELECT "productId", MAX("createdAt") AS "lastSoldAt"
    FROM "StockMove"
    WHERE "reason" IN ('ORDER', 'ISSUE') AND "change" < 0
    GROUP BY "productId"
  `;
  const lastSoldByProduct = new Map(
    soldRows.map((r) => [r.productId, r.lastSoldAt])
  );

  const rows = await prisma.$queryRaw<
    {
      productId: string;
      name: string;
      stock: number;
      value: number;
    }[]
  >`
    SELECT p."id" AS "productId",
           p."name",
           SUM(s."quantity")::int AS stock,
           SUM(s."quantity" * COALESCE(p."costPrice", p."price"))::bigint AS value
    FROM "Stock" s
    JOIN "Product" p ON p."id" = s."productId"
    GROUP BY p."id", p."name"
    HAVING SUM(s."quantity") > 0
  `;

  return rows
    .filter((r) => {
      const lastSoldAt = lastSoldByProduct.get(r.productId);
      return !lastSoldAt || lastSoldAt < cutoff;
    })
    .map((r) => ({
      productId: r.productId,
      name: r.name,
      stock: Number(r.stock),
      value: Number(r.value),
      lastSoldAt: lastSoldByProduct.get(r.productId) ?? null,
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

  // O'rtacha ombor qiymati — tannarx bo'yicha (COGS bilan solishtiriladigan).
  const rows = await prisma.$queryRaw<{ value: number }[]>`
    SELECT SUM(s."quantity" * COALESCE(p."costPrice", p."price"))::bigint AS value
    FROM "Stock" s
    JOIN "Product" p ON p."id" = s."productId"
  `;
  const inventoryValue = Number(rows[0]?.value ?? 0);
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
