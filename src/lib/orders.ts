import type { Prisma, OrderStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { reserveStock, releaseStock, recordStockChange } from "@/lib/stock";
import { writeAuditLog } from "@/lib/audit";
import { getMainWarehouseId } from "@/lib/warehouse";

type TxClient = Prisma.TransactionClient;

export async function generateOrderNumber(): Promise<string> {
  const count = await prisma.order.count();
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

// Buyurtma yaratish — mahsulotlarni band qiladi (reserveStock), lekin
// jismoniy qoldiqni hali kamaytirmaydi. DRAFT holatda yaratiladi, keyin
// CONFIRMED holatiga o'tkazilganda zaxira qo'yiladi (pastga qarang).
export async function createOrder(
  input: CreateOrderInput,
  actorId?: string | null
) {
  if (input.items.length === 0) {
    throw new Error("Buyurtmada kamida bitta mahsulot bo'lishi kerak.");
  }

  const number = await generateOrderNumber();

  return prisma.$transaction(async (tx) => {
    const warehouseId = input.warehouseId ?? (await getMainWarehouseId(tx));

    // Narx bilan birga tannarxni ham saqlaymiz — foyda hisob-kitobi uchun.
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
        newData: { number: order.number },
      },
      tx
    );

    return order;
  });
}

const REVERSIBLE_STATUSES: OrderStatus[] = [
  "DRAFT",
  "CONFIRMED",
  "PROCESSING",
  "READY_TO_SHIP",
];

// Buyurtma holatini o'zgartiradi va tegishli ombor harakatini bajaradi:
// - DRAFT -> CONFIRMED: mahsulotlarni zaxiralaydi (reserveStock)
// - ... -> SHIPPED: zaxirani yopib, jismoniy qoldiqni kamaytiradi (ORDER chiqim)
// - ... -> CANCELLED: agar zaxira qo'yilgan bo'lsa, bo'shatadi
export async function updateOrderStatus(
  orderId: string,
  nextStatus: OrderStatus,
  actorId?: string | null
) {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUniqueOrThrow({
      where: { id: orderId },
      include: { items: true },
    });

    if (order.status === nextStatus) return;

    const warehouseId = order.warehouseId ?? (await getMainWarehouseId(tx));

    // DRAFT -> CONFIRMED (yoki undan keyingi bosqichlarga to'g'ridan-to'g'ri
    // o'tish): birinchi marta zaxiralanadi.
    const wasReserved = order.status !== "DRAFT";
    const willBeReserved = REVERSIBLE_STATUSES.includes(nextStatus);

    if (!wasReserved && willBeReserved) {
      for (const item of order.items) {
        await reserveStock(tx, {
          productId: item.productId,
          warehouseId,
          quantity: item.quantity,
          allowOverReserve: true, // admin qo'lda boshqaradi, qattiq bloklamaymiz
        });
      }
    }

    // ... -> SHIPPED: zaxira yopiladi, jismoniy qoldiq kamayadi.
    if (nextStatus === "SHIPPED" && order.status !== "SHIPPED") {
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
          allowNegative: true,
        });
      }
    }

    // ... -> CANCELLED: agar zaxira qo'yilgan bo'lsa (lekin hali
    // jo'natilmagan bo'lsa), bo'shatiladi.
    if (nextStatus === "CANCELLED" && wasReserved && order.status !== "SHIPPED") {
      for (const item of order.items) {
        await releaseStock(tx, {
          productId: item.productId,
          warehouseId,
          quantity: item.quantity,
        });
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
