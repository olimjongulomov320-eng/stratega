import { prisma } from "@/lib/prisma";
import { getInventoryForecast, getReorderRecommendations } from "@/lib/inventory-assistant";
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

  return alerts;
}

// Joriy muammolarni AuditLog kabi tarixiy jurnalga emas, balki "hozirgi
// holat"ga aylantiradi: avval hal bo'lgan (resolvedAt bор) yozuvlarni
// tekshirmaydi, faqat hal qilinmagan (resolvedAt = null) yozuvlarni
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

export async function getActiveAlerts(limit = 20) {
  await refreshAlerts();
  return prisma.alert.findMany({
    where: { resolvedAt: null },
    orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
    take: limit,
  });
}
