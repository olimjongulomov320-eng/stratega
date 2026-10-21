import type { Prisma, OrderStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { releaseStock, reserveStock } from "@/lib/stock";
import { writeAuditLog } from "@/lib/audit";
import { getMainWarehouseId } from "@/lib/warehouse";
import { getBoolSetting, SETTING_KEYS } from "@/lib/settings";
import { nextBusinessNumber } from "@/lib/numbers";
import { createShipmentFromOrder, postShipment, remainingToShip } from "@/lib/shipments";

type TxClient = Prisma.TransactionClient;

// Raqam generatsiyasi: ORD-000123. Sequence'dan olinadi — parallel
// chaqiruvlarda dubl yaratilmaydi va o'chirilgan buyurtmalar raqamni
// qayta ishlatmaydi.
export async function generateOrderNumber(tx?: TxClient): Promise<string> {
  return nextBusinessNumber("order", { prefix: "ORD" }, tx);
}

export type OrderItemInput = {
  productId: string;
  quantity: number;
  price: number;
};

export type CreateOrderInput = {
  customerId?: string | null;
  warehouseId?: string | null;
  note?: string | null;
  items: OrderItemInput[];
};

// Holatlar jadvali — ixtiyoriy o'tishlar taqiqlanadi.
const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  DRAFT: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "READY_TO_SHIP", "CANCELLED"],
  PROCESSING: ["READY_TO_SHIP", "CANCELLED"],
  READY_TO_SHIP: ["SHIPPED", "PROCESSING", "CANCELLED"],
  // Jo'natilgan buyurtma faqat "yetkazildi" bo'ladi — ombordan chiqgan
  // mahsulot qaytarilmaydi (qaytarish uchun alohida RETURN hujjati bor).
  SHIPPED: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
};

// UI faqat shu ro'yxatdagi holatlarni ko'rsatadi (server ham tekshiradi).
export function allowedOrderTransitions(status: OrderStatus): OrderStatus[] {
  return ORDER_TRANSITIONS[status] ?? [];
}

// Buyurtma yaratish — mahsulotlarni band qilmaydi (DRAFT), lekin tannarxni
// snapshotlaydi — foyda hisob-kitobi uchun.
export async function createOrder(
  input: CreateOrderInput,
  actorId?: string | null
) {
  if (input.items.length === 0) {
    throw new Error("Buyurtmada kamida bitta mahsulot bo'lishi kerak.");
  }
  for (const item of input.items) {
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new Error("Buyurtma miqdori musbat butun son bo'lishi kerak.");
    }
    if (!Number.isFinite(item.price) || item.price < 0) {
      throw new Error("Buyurtma narxi noto'g'ri.");
    }
  }

  const seen = new Set<string>();
  for (const item of input.items) {
    if (seen.has(item.productId)) {
      throw new Error("Buyurtmada bir xil mahsulot bir necha marta kiritilgan.");
    }
    seen.add(item.productId);
  }

  return prisma.$transaction(async (tx) => {
    const number = await generateOrderNumber(tx);
    const warehouseId = input.warehouseId ?? (await getMainWarehouseId(tx));

    const productIds = input.items.map((i) => i.productId);
    const products = await tx.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, costPrice: true },
    });
    const costByProduct = new Map(products.map((p) => [p.id, p.costPrice]));

    const order = await tx.order.create({
      data: {
        number,
        customerId: input.customerId ?? null,
        warehouseId,
        note: input.note ?? null,
        status: "DRAFT",
        items: {
          create: input.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            costPrice: costByProduct.get(item.productId) ?? null,
          })),
        },
      },
      include: { items: true },
    });

    await writeAuditLog(
      {
        actorId,
        action: "order.create",
        entity: "Order",
        entityId: order.id,
        newData: { number: order.number, items: input.items.length },
      },
      tx
    );

    return order;
  });
}

const RESERVED_STATUSES: OrderStatus[] = ["CONFIRMED", "PROCESSING", "READY_TO_SHIP"];

export type UpdateOrderStatusOptions = {
  // OWNER/ADMIN roli yoki tizim sozlamasi orqali oshiqcha zaxiraga ruxsat.
  allowOverReserve?: boolean;
};

/**
 * Buyurtma holatini o'zgartiradi va tegishli ombor harakatlarini bajaradi:
 * - DRAFT -> CONFIRMED: mahsulotlarni zaxiralaydi (reserved += qty).
 *   Jismoniy qoldiq BU YERDA KAMAYMAYDI — faqat band qilinadi.
 * - ... -> SHIPPED: avval jo'natma yaratilib jo'natiladi (jo'natma orqali
 *   zaxira yopiladi va jismoniy qoldiq kamayadi). Jismoniy yozishning
 *   yagona yo'li — jo'natma bo'lishi kerak, aks holda jurnalda
 *   hujjatga bog'lanmagan chiqim qoladi.
 * - ... -> CANCELLED: jo'natilmagan qoldiq uchun zaxira bo'shatiladi.
 * Barcha ombor yozuvlari bitta tranzaksiyada; idempotent.
 */
export async function updateOrderStatus(
  orderId: string,
  nextStatus: OrderStatus,
  actorId?: string | null,
  options: UpdateOrderStatusOptions = {}
) {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUniqueOrThrow({
      where: { id: orderId },
      include: { items: true, shipments: { include: { items: true } } },
    });

    if (order.status === nextStatus) return;

    const allowed = ORDER_TRANSITIONS[order.status] ?? [];
    if (!allowed.includes(nextStatus)) {
      throw new Error(
        `"${order.status}" holatidan "${nextStatus}" holatiga o'tib bo'lmaydi. Ruxsat etilgan: ${allowed.join(", ") || "yo'q"}.`
      );
    }

    // Buyurtma qatorini bloklaymiz — parallel so'rovlarda holat
    // o'zgarishlari ketma-ket bo'lishi kafolatlanadi.
    await tx.$executeRaw`SELECT id FROM "Order" WHERE id = ${orderId} FOR UPDATE`;

    const warehouseId = order.warehouseId ?? (await getMainWarehouseId(tx));
    const isReserved = order.stockReservedAt !== null;

    // Zaxira: birinchi marta CONFIRMED o'tishida qo'yiladi.
    if (!isReserved && RESERVED_STATUSES.includes(nextStatus)) {
      const overReserveAllowed =
        options.allowOverReserve ??
        (await getBoolSetting(SETTING_KEYS.ALLOW_OVER_RESERVE));
      for (const item of order.items) {
        await reserveStock(tx, {
          productId: item.productId,
          warehouseId,
          quantity: item.quantity,
          allowOverReserve: overReserveAllowed,
        });
      }
      await tx.order.update({
        where: { id: orderId },
        data: { stockReservedAt: new Date() },
      });
    }

    // Bekor qilinishi: JO'NATILMAGAN qoldiq uchun zaxira bo'shatiladi.
    if (nextStatus === "CANCELLED") {
      // Faqat ZAXIRALANGAN buyurtma uchun zaxira bo'shatiladi. DRAFT'da
      // zaxira qo'yilmagan — o'sha paytda bo'shatish "reserved"ni manfiyga
      // olib kelardi va DB trigger bekor qilinishini xato bilan to'xtatardi.
      if (order.stockReservedAt !== null) {
        const left = remainingToShip(order.items, order.shipments);
        for (const item of order.items) {
          const quantity = left.get(item.productId) ?? 0;
          if (quantity <= 0) continue;
          await releaseStock(tx, {
            productId: item.productId,
            warehouseId,
            quantity,
            allowOverRelease: true,
          });
        }
      }
      // Qoralama/tayyor jo'natmalar ham bekor qilinadi.
      for (const shipment of order.shipments) {
        if (shipment.status === "DRAFT" || shipment.status === "READY") {
          await tx.shipment.update({
            where: { id: shipment.id },
            data: { status: "CANCELLED" },
          });
        }
      }
      await tx.order.update({
        where: { id: orderId },
        data: { stockReservedAt: null },
      });
    }

    // Jo'natish: jismoniy yozish JO'NATMA orqali amalga oshadi.
    if (nextStatus === "SHIPPED") {
      const left = remainingToShip(order.items, order.shipments);
      if (left.size > 0) {
        const shipment = await createShipmentFromOrder(
          orderId,
          actorId,
          {
            items: Array.from(left.entries()).map(([productId, quantity]) => ({
              productId,
              quantity,
            })),
            warehouseId,
          },
          tx
        );
        await postShipment(shipment.id, actorId, tx);
      }
    }

    await tx.order.update({
      where: { id: orderId },
      data: { status: nextStatus },
    });

    await writeAuditLog(
      {
        actorId,
        action: "order.status_change",
        entity: "Order",
        entityId: orderId,
        oldData: { status: order.status },
        newData: { status: nextStatus },
      },
      tx
    );
  });
}
