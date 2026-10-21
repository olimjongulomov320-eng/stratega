import type { Prisma, OrderStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { reserveStock, releaseStock, recordStockChange } from "@/lib/stock";
import { writeAuditLog } from "@/lib/audit";
import { getMainWarehouseId } from "@/lib/warehouse";
import { getBoolSetting, SETTING_KEYS } from "@/lib/settings";

type TxClient = Prisma.TransactionClient;

// Raqam generatsiyasi: ORD-000123. Count asosidagi generator parallel
// chaqiruvlarda dubl yaratishi mumkin — shuning uchun yaratish tranzaksiyasi
// P2002 (unique) xatosida qayta uriniladi.
export async function generateOrderNumber(tx?: TxClient): Promise<string> {
  const client = tx ?? prisma;
  const count = await client.order.count();
  return `ORD-${String(count + 1).padStart(6, "0")}`;
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

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await createOrderInner(input, actorId);
    } catch (err) {
      const isUniqueRace =
        err instanceof Error && "code" in err && (err as { code?: string }).code === "P2002";
      if (!isUniqueRace || attempt === 2) throw err;
    }
  }
  throw new Error("Buyurtma raqamini yaratib bo'lmadi.");
}

async function createOrderInner(input: CreateOrderInput, actorId?: string | null) {
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

// Buyurtma holatini o'zgartiradi va tegishli ombor harakatlarini bajaradi:
// - DRAFT -> CONFIRMED: mahsulotlarni zaxiralaydi (reserved += qty)
// - ... -> SHIPPED: zaxirani yopib, jismoniy qoldiqni kamaytiradi (bir marta!)
// - ... -> CANCELLED: zaxirani bo'shatadi (agar qo'yilgan bo'lsa)
// Barcha ombor yozuvlari bitta tranzaksiyada; idempotent (qayta ishga tushirilmaydi).
export async function updateOrderStatus(
  orderId: string,
  nextStatus: OrderStatus,
  actorId?: string | null,
  options: UpdateOrderStatusOptions = {}
) {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUniqueOrThrow({
      where: { id: orderId },
      include: { items: true },
    });

    if (order.status === nextStatus) return;

    const allowed = ORDER_TRANSITIONS[order.status] ?? [];
    if (!allowed.includes(nextStatus)) {
      throw new Error(
        `"${order.status}" holatidan "${nextStatus}" holatiga o'tib bo'lmaydi. Ruxsat etilgan: ${allowed.join(", ") || "yo'q"}.`
      );
    }

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

    // Bekor qilinishi: zaxira bo'shatiladi (faqt jo'natilmagan bo'lsa).
    if (nextStatus === "CANCELLED" && isReserved && order.stockDeductedAt === null) {
      for (const item of order.items) {
        await releaseStock(tx, {
          productId: item.productId,
          warehouseId,
          quantity: item.quantity,
        });
      }
      await tx.order.update({
        where: { id: orderId },
        data: { stockReservedAt: null },
      });
    }

    // Jo'natilishi: zaxira yopiladi + jismoniy qoldiq kamayadi — BIR MARTA.
    if (nextStatus === "SHIPPED" && order.stockDeductedAt === null) {
      for (const item of order.items) {
        await releaseStock(tx, {
          productId: item.productId,
          warehouseId,
          quantity: item.quantity,
        });
        await recordStockChange(tx, {
          productId: item.productId,
          warehouseId,
          change: -item.quantity,
          reason: "ISSUE",
          note: `Buyurtma ${order.number} jo'natildi`,
          referenceType: "Order",
          referenceId: order.id,
        });
        await tx.product.update({
          where: { id: item.productId },
          data: { soldCount: { increment: item.quantity } },
        });
      }
      await tx.order.update({
        where: { id: orderId },
        data: { stockDeductedAt: new Date(), stockReservedAt: null },
      });
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
