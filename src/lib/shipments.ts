import type { Prisma, ShipmentStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { releaseStock, recordStockChange } from "@/lib/stock";
import { writeAuditLog } from "@/lib/audit";
import { getMainWarehouseId } from "@/lib/warehouse";

type TxClient = Prisma.TransactionClient;

// Jo'natmalar (Shipment) — buyurtmaning ombor qismini rasmiylashtiradi.
// DRAFT -> READY -> SHIPPED -> DELIVERED. SHIPPED qilinishi zaxirani yopadi
// va jismoniy qoldiqni kamaytiradi (order.stockDeductedAt orqali bir marta).

export type ShipmentItemInput = { productId: string; quantity: number };

export async function generateShipmentNumber(tx?: TxClient): Promise<string> {
  const client = tx ?? prisma;
  const count = await client.shipment.count();
  return `SHP-${String(count + 1).padStart(6, "0")}`;
}

// Buyurtmadan jo'natma yaratadi. items berilsa — qisman jo'natma (bir
// buyurtmadan bir nechta jo'natma). Berilmasa — buyurtmada qolgan qoldiq.
export async function createShipmentFromOrder(
  orderId: string,
  actorId?: string | null,
  options: { items?: ShipmentItemInput[]; note?: string | null; warehouseId?: string | null } = {}
) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUniqueOrThrow({
      where: { id: orderId },
      include: { items: true, shipments: { include: { items: true } } },
    });

    if (["DRAFT", "CANCELLED", "SHIPPED", "COMPLETED"].includes(order.status)) {
      throw new Error(
        `Jo'natma faqat CONFIRMED/PROCESSING/READY_TO_SHIP holatidagi buyurtmadan yaratiladi (hozirgi: ${order.status}).`
      );
    }

    // Buyurtma bo'yicha hali jo'natilmagan qoldiqni hisoblaymiz.
    const shippedByProduct = new Map<string, number>();
    for (const shipment of order.shipments) {
      if (shipment.status === "CANCELLED") continue;
      for (const item of shipment.items) {
        shippedByProduct.set(
          item.productId,
          (shippedByProduct.get(item.productId) ?? 0) + item.quantity
        );
      }
    }

    const requested: ShipmentItemInput[] =
      options.items ??
      order.items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity - (shippedByProduct.get(i.productId) ?? 0),
      }));

    if (requested.length === 0) {
      throw new Error("Bu buyurtma bo'yicha jo'natiladigan qoldiq qolmagan.");
    }

    const orderQtyByProduct = new Map(order.items.map((i) => [i.productId, i.quantity]));

    for (const item of requested) {
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        throw new Error("Jo'natma miqdori musbat butun son bo'lishi kerak.");
      }
      const orderQty = orderQtyByProduct.get(item.productId);
      if (orderQty === undefined) {
        throw new Error("Mahsulot bu buyurtmada yo'q.");
      }
      const remaining = orderQty - (shippedByProduct.get(item.productId) ?? 0);
      if (item.quantity > remaining) {
        throw new Error(
          `Miqdor buyurtmadan ortiq: mavjud qoldiq ${remaining}.`
        );
      }
    }

    const shipment = await tx.shipment.create({
      data: {
        number: await generateShipmentNumber(tx),
        orderId,
        warehouseId: options.warehouseId ?? order.warehouseId ?? (await getMainWarehouseId(tx)),
        responsibleId: actorId ?? null,
        note: options.note ?? null,
        status: "DRAFT",
        items: {
          create: requested.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
          })),
        },
      },
      include: { items: true },
    });

    await writeAuditLog(
      {
        actorId,
        action: "shipment.create",
        entity: "Shipment",
        entityId: shipment.id,
        newData: { number: shipment.number, orderId },
      },
      tx
    );

    return shipment;
  });
}

// Jo'natmani qayd etish (yozish): zaxira yopiladi, jismoniy qoldiq
// kamayadi, buyurtma SHIPPED holatiga o'tadi. Tranzaksiya ichida, idempotent.
export async function postShipment(shipmentId: string, actorId?: string | null) {
  await prisma.$transaction(async (tx) => {
    const shipment = await tx.shipment.findUniqueOrThrow({
      where: { id: shipmentId },
      include: { items: true, order: { include: { items: true } } },
    });

    if (shipment.status === "SHIPPED" || shipment.status === "DELIVERED") {
      throw new Error("Jo'natma allaqachon jo'natilgan.");
    }
    if (shipment.status === "CANCELLED") {
      throw new Error("Bekor qilingan jo'natmani jo'natib bo'lmaydi.");
    }

    const warehouseId = shipment.warehouseId ?? (await getMainWarehouseId(tx));

    // Agar buyurtma allaqachon status orqali SHIPPED qilingan bo'lsa
    // (stockDeductedAt o'rnatilgan), bu jo'natma uchun qayta yozmaymiz.
    const alreadyDeducted = shipment.order.stockDeductedAt !== null;

    if (!alreadyDeducted) {
      for (const item of shipment.items) {
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
          note: `Jo'natma ${shipment.number} (buyurtma ${shipment.order.number})`,
          referenceType: "Shipment",
          referenceId: shipment.id,
        });
      }

      // Sotuvlar hisobga olinadi.
      for (const item of shipment.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { soldCount: { increment: item.quantity } },
        });
      }
    }

    await tx.shipment.update({
      where: { id: shipmentId },
      data: { status: "SHIPPED", shippedAt: new Date() },
    });

    // Buyurtmani SHIPPED'ga o'tkazamiz (stockDeductedAt allaqachon o'rnatilgan
    // bo'lsa orders.ts bu operatsiyani takrorlamaydi).
    await tx.order.update({
      where: { id: shipment.orderId },
      data: {
        status: "SHIPPED",
        stockDeductedAt: shipment.order.stockDeductedAt ?? new Date(),
        stockReservedAt: null,
      },
    });

    await writeAuditLog(
      {
        actorId,
        action: "shipment.post",
        entity: "Shipment",
        entityId: shipmentId,
        newData: { number: shipment.number, orderId: shipment.orderId },
      },
      tx
    );
  });
}

export async function markShipmentReady(shipmentId: string, actorId?: string | null) {
  await prisma.$transaction(async (tx) => {
    const shipment = await tx.shipment.findUniqueOrThrow({ where: { id: shipmentId } });
    if (shipment.status !== "DRAFT") {
      throw new Error("Faqat qoralama jo'natma tayyor deb belgilanadi.");
    }
    await tx.shipment.update({ where: { id: shipmentId }, data: { status: "READY" } });
    await writeAuditLog(
      {
        actorId,
        action: "shipment.ready",
        entity: "Shipment",
        entityId: shipmentId,
        newData: { number: shipment.number },
      },
      tx
    );
  });
}

// Yetkazildi deb belgilash — buyurtmani COMPLETED'ga o'tkazadi.
export async function deliverShipment(shipmentId: string, actorId?: string | null) {
  await prisma.$transaction(async (tx) => {
    const shipment = await tx.shipment.findUniqueOrThrow({ where: { id: shipmentId } });
    if (shipment.status !== "SHIPPED") {
      throw new Error("Faqat jo'natilgan jo'natmani yetkazilgan deb belgilash mumkin.");
    }
    await tx.shipment.update({
      where: { id: shipmentId },
      data: { status: "DELIVERED", deliveredAt: new Date() },
    });
    await tx.order.update({
      where: { id: shipment.orderId },
      data: { status: "COMPLETED" },
    });
    await writeAuditLog(
      {
        actorId,
        action: "shipment.deliver",
        entity: "Shipment",
        entityId: shipmentId,
        newData: { number: shipment.number },
      },
      tx
    );
  });
}

export async function cancelShipment(shipmentId: string, actorId?: string | null) {
  await prisma.$transaction(async (tx) => {
    const shipment = await tx.shipment.findUniqueOrThrow({ where: { id: shipmentId } });
    if (shipment.status === "SHIPPED" || shipment.status === "DELIVERED") {
      throw new Error(
        "Jo'natilgan jo'natmani bekor qilib bo'lmaydi — qaytarish uchun RETURN hujjati yarating."
      );
    }
    if (shipment.status === "CANCELLED") return;

    await tx.shipment.update({
      where: { id: shipmentId },
      data: { status: "CANCELLED" },
    });
    await writeAuditLog(
      {
        actorId,
        action: "shipment.cancel",
        entity: "Shipment",
        entityId: shipmentId,
        newData: { number: shipment.number },
      },
      tx
    );
  });
}

const SHIPMENT_TRANSITIONS: Record<ShipmentStatus, ShipmentStatus[]> = {
  DRAFT: ["READY", "CANCELLED"],
  READY: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

export function allowedShipmentTransitions(status: ShipmentStatus): ShipmentStatus[] {
  return SHIPMENT_TRANSITIONS[status] ?? [];
}
