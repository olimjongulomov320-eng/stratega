import { prisma } from "@/lib/prisma";
import { getInventoryForecast } from "@/lib/inventory-assistant";
import { getIntSetting, SETTING_KEYS } from "@/lib/settings";
import type { AlertType, AlertSeverity } from "@/generated/prisma/client";

const STOCKOUT_WARNING_DAYS = 7;
const STOCKOUT_CRITICAL_DAYS = 3;

type GeneratedAlert = {
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  entity: string;
  entityId: string;
};

// Joriy ma'lumotlar asosida haqiqiy muammolarni aniqlaydi. Soxta/qo'lda
// yozilgan ogohlantirish yo'q — faqat hisoblangan haqiqiy holatlar.
async function computeCurrentAlerts(): Promise<GeneratedAlert[]> {
  const forecast = await getInventoryForecast();
  const alerts: GeneratedAlert[] = [];
  const lowStockThreshold = await getIntSetting(SETTING_KEYS.LOW_STOCK_THRESHOLD);
  const overstockMultiplier = await getIntSetting(SETTING_KEYS.OVERSTOCK_MULTIPLIER);

  for (const f of forecast) {
    if (f.currentStock <= 0) {
      alerts.push({
        type: "OUT_OF_STOCK",
        severity: "CRITICAL",
        title: `${f.name} tugagan`,
        description: "Ombordagi qoldiq 0 yoki undan kam.",
        entity: "Product",
        entityId: f.productId,
      });
      continue;
    }

    // Ortiqcha ombor: qoldiq chegara×koeffitsientdan yuqori va
    // sotuv sur'ati juda past (90+ kun yetarli).
    const overstockLevel = Math.max(lowStockThreshold, 5) * Math.max(overstockMultiplier, 1);
    if (
      f.currentStock > overstockLevel &&
      (f.avgDailyConsumption === 0 ||
        (f.daysUntilStockout !== null && f.daysUntilStockout > 90))
    ) {
      alerts.push({
        type: "OVERSTOCK",
        severity: "INFO",
        title: `${f.name} ortiqcha omborda`,
        description: `Qoldiq ${f.currentStock} dona; joriy sur'at bilan 90+ kun yetadi.`,
        entity: "Product",
        entityId: f.productId,
      });
    }

    if (
      f.daysUntilStockout !== null &&
      f.daysUntilStockout <= STOCKOUT_WARNING_DAYS
    ) {
      alerts.push({
        type: "LOW_STOCK",
        severity:
          f.daysUntilStockout <= STOCKOUT_CRITICAL_DAYS ? "CRITICAL" : "WARNING",
        title: `${f.name} tez orada tugaydi`,
        description: `Taxminan ${Math.ceil(f.daysUntilStockout)} kundan keyin tugaydi.`,
        entity: "Product",
        entityId: f.productId,
      });
    }
  }

  // Kechikgan buyurtmalar (7 kundan ortiq tasdiqlangan).
  const overdueOrders = await prisma.order.findMany({
    where: {
      status: { in: ["CONFIRMED", "PROCESSING"] },
      createdAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    },
    select: { id: true, number: true },
  });
  for (const order of overdueOrders) {
    alerts.push({
      type: "ORDER_DELAY",
      severity: "WARNING",
      title: `Buyurtma ${order.number} kechikmoqda`,
      description: "7 kundan ortiq tasdiqlangan holatda turibdi.",
      entity: "Order",
      entityId: order.id,
    });
  }

  // Kechiktirilgan to'lovlar: yetkazilgan/tasdiqlangan buyurtmada to'lov
  // chegaradan ortiq kechikgan.
  const paymentOverdueDays = await getIntSetting(SETTING_KEYS.PAYMENT_OVERDUE_DAYS);
  const shippedOrders = await prisma.order.findMany({
    where: {
      status: { in: ["SHIPPED", "COMPLETED", "READY_TO_SHIP"] },
      stockDeductedAt: { not: null },
      updatedAt: {
        lt: new Date(Date.now() - paymentOverdueDays * 24 * 60 * 60 * 1000),
      },
    },
    select: {
      id: true,
      number: true,
      items: { select: { price: true, quantity: true } },
      payments: { select: { amount: true, status: true } },
    },
    take: 100,
  });
  for (const order of shippedOrders) {
    const total = order.items.reduce((s, i) => s + i.price * i.quantity, 0);
    const paid = order.payments
      .filter((p) => p.status !== "REFUNDED")
      .reduce((s, p) => s + p.amount, 0);
    if (total > paid) {
      alerts.push({
        type: "PAYMENT_OVERDUE",
        severity: paid > 0 ? "WARNING" : "CRITICAL",
        title: `Buyurtma ${order.number}: to'lov kechikmoqda`,
        description: `Qarz: ${(total - paid).toLocaleString("uz-UZ")} so'm, ${paymentOverdueDays}+ kun o'tgan.`,
        entity: "Order",
        entityId: order.id,
      });
    }
  }

  // So'nggi 24 soatdagi narx o'zgarishlari (muhim narx siqishlari).
  const recentPriceChanges = await prisma.priceHistory.findMany({
    where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, productId: true, oldPrice: true, newPrice: true, createdAt: true },
  });

  if (recentPriceChanges.length > 0) {
    // Har bir mahsulot uchun FAQAT eng so'nggi o'zgarish hisobga olinadi
    // (bir mahsulot uchun 10 ta alert kerak emas).
    const latestByProduct = new Map<string, (typeof recentPriceChanges)[number]>();
    for (const change of recentPriceChanges) {
      if (!latestByProduct.has(change.productId)) {
        latestByProduct.set(change.productId, change);
      }
    }

    // Mavjud PRICE_CHANGE alertlari bitta so'rovda olinadi (N+1 yo'q):
    // mahsulot uchun eng oldingi alert yaratilgan vaqti kerak.
    const oldestChangeAt = recentPriceChanges[recentPriceChanges.length - 1]!.createdAt;
    const existingAlerts = await prisma.alert.findMany({
      where: { type: "PRICE_CHANGE", createdAt: { gte: oldestChangeAt } },
      select: { entityId: true, createdAt: true },
    });
    const firstAlertAt = new Map<string, Date>();
    for (const alert of existingAlerts) {
      if (!alert.entityId) continue;
      const current = firstAlertAt.get(alert.entityId);
      if (!current || alert.createdAt < current) {
        firstAlertAt.set(alert.entityId, alert.createdAt);
      }
    }

    for (const change of latestByProduct.values()) {
      // Bu o'zgarishdan keyin alert yaratilgan bo'lsa — qayta yaratilmaydi.
      const existingAt = firstAlertAt.get(change.productId);
      if (existingAt && existingAt >= change.createdAt) continue;

      const direction = change.newPrice > change.oldPrice ? "qimmatlashdi" : "arzonlashdi";
      alerts.push({
        type: "PRICE_CHANGE",
        severity: "INFO",
        title: `Narx ${direction}`,
        description: `${change.oldPrice.toLocaleString("uz-UZ")} → ${change.newPrice.toLocaleString("uz-UZ")} so'm.`,
        entity: "Product",
        entityId: change.productId,
      });
    }
  }

  // Odatiydan tashqari sotuv: so'nggi 24 soatda o'rtacha 30 kunlik
  // kunlik sur'atdan 3 barobar ko'p sotilgan mahsulotlar.
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const unusualSales = await prisma.orderItem.groupBy({
    by: ["productId"],
    where: {
      order: {
        status: { notIn: ["DRAFT", "CANCELLED"] },
        createdAt: { gte: dayAgo },
      },
    },
    _sum: { quantity: true },
  });
  for (const row of unusualSales) {
    const f = forecast.find((x) => x.productId === row.productId);
    const sold24h = row._sum?.quantity ?? 0;
    if (!f || f.avgDailyConsumption <= 0) continue;
    if (sold24h >= f.avgDailyConsumption * 3 && sold24h > 5) {
      alerts.push({
        type: "UNUSUAL_SALES",
        severity: "INFO",
        title: `${f.name}: odatdan yuqori savdo`,
        description: `So'nggi 24 soatda ${sold24h} dona (o'rtacha ${f.avgDailyConsumption.toFixed(1)}/kun).`,
        entity: "Product",
        entityId: row.productId,
      });
    }
  }

  // Inventarizatsiya anomaliyasi: manfiy qoldiq yoki zaxira qoldiqdan oshiq.
  // Anomaliya sharti bazada tekshiriladi — JS da filtrlash uchun barcha
  // "reserved > 0" qatorlarini yuklash kerak emas.
  const suspiciousStock = await prisma.$queryRaw<
    { productId: string; quantity: number; reserved: number }[]
  >`
    SELECT "productId", "quantity", "reserved"
    FROM "Stock"
    WHERE "quantity" < 0 OR "reserved" > "quantity"
    LIMIT 50
  `;

  for (const stock of suspiciousStock) {
    alerts.push({
      type: "INVENTORY_ANOMALY",
      severity: "CRITICAL",
      title: "Ombor anomaliyasi",
      description: `Qoldiq: ${stock.quantity}, zaxira: ${stock.reserved} — zaxira qoldiqdan oshiq yoki qoldiq manfiy.`,
      entity: "Stock",
      entityId: `${stock.productId}`,
    });
  }

  return alerts;
}

// Joriy muammolarni AuditLog kabi tarixiy jurnalga emas, balki "hozirgi
// holat"ga aylantiradi: avval hal qilinmagan (resolvedAt = null) yozuvlarni
// yangi hisob-kitob bilan sinxronlaydi.
export async function refreshAlerts(): Promise<{ created: number; resolved: number }> {
  const current = await computeCurrentAlerts();
  const currentKeys = new Set(current.map((a) => `${a.type}:${a.entityId}`));

  const existing = await prisma.alert.findMany({
    where: { resolvedAt: null },
    select: { id: true, type: true, entityId: true },
  });
  const existingKeys = new Set(
    existing.map((a) => `${a.type}:${a.entityId}`)
  );

  // Endi haqiqiy bo'lmagan muammolarni "hal qilingan" deb belgilaymiz.
  const toResolve = existing.filter(
    (a) => !currentKeys.has(`${a.type}:${a.entityId}`)
  );
  if (toResolve.length > 0) {
    await prisma.alert.updateMany({
      where: { id: { in: toResolve.map((a) => a.id) } },
      data: { resolvedAt: new Date() },
    });
  }

  // Yangi paydo bo'lgan muammolarni yozamiz.
  const toCreate = current.filter(
    (a) => !existingKeys.has(`${a.type}:${a.entityId}`)
  );
  if (toCreate.length > 0) {
    await prisma.alert.createMany({
      data: toCreate.map((a) => ({
        type: a.type,
        severity: a.severity,
        title: a.title,
        description: a.description,
        entity: a.entity,
        entityId: a.entityId,
      })),
    });
  }

  return { created: toCreate.length, resolved: toResolve.length };
}

/**
 * Faol ogohlantirishlarni o'qiydi — HECH QANDAY yozuv qilmaydi.
 *
 * Avval bu funksiya har chaqirilishida `refreshAlerts()` ni ishga tushirib,
 * GET so'rovida bazaga yozuv qilardi (write-on-read). Bu:
 *   * har sahifa yuklanishida yozuv yukini keltiradi;
 *   * faqat o'qish huquqi bilan kirgan foydalanuvchi orqali ma'lumot
 *     o'zgarishiga olib kelishi mumkin edi.
 * Endi yangilash faqat aniq "Yangilash" amali orqali bajariladi
 * (`refreshAlerts()` / `refreshAlertsAction`).
 */
export async function getActiveAlerts(limit = 20) {
  return prisma.alert.findMany({
    where: { resolvedAt: null },
    orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
    take: limit,
  });
}

// Ogohlantirishni "ko'rilgan" deb belgilash.
export async function markAlertRead(alertId: string): Promise<void> {
  await prisma.alert.updateMany({
    where: { id: alertId, readAt: null },
    data: { readAt: new Date() },
  });
}

// Ogohlantirishni qo'lda hal qilish (masalan, administrator tuzatdi).
export async function resolveAlertManually(
  alertId: string,
  resolvedById?: string | null
): Promise<void> {
  await prisma.alert.updateMany({
    where: { id: alertId, resolvedAt: null },
    data: { resolvedAt: new Date(), resolvedById: resolvedById ?? null },
  });
}
