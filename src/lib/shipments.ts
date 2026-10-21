import type { Prisma, ShipmentStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { releaseStock, recordStockChange } from "@/lib/stock";
import { writeAuditLog } from "@/lib/audit";
import { getMainWarehouseId } from "@/lib/warehouse";
import { nextBusinessNumber } from "@/lib/numbers";

type TxClient = Prisma.TransactionClient;

// Jo'natmalar (Shipment) — buyurtmaning ombor qismini rasmiylashtiradi.
// DRAFT -> READY -> SHIPPED -> DELIVERED.
//
// MUHIM: jismoniy qoldiqni kamaytirishning YAGONA yo'li — bu jo'natmani
// "jo'natilgan" (SHIPPED) deb belgilash. Shu sababli:
//   * qisman jo'natishda har bir jo'natma faqat o'z miqdorini yozadi
//     (avvalgi versiya buyurtma darajasidagi `stockDeductedAt` belgisiga
//     qaragan holda, ikkinchi jo'natma umuman yozilmay qolardi —
//     ya'ni tovar "yo'qolgan" bo'lardi);
//   * bir jo'natma faqat bir marta yoziladi (`stockAppliedAt`).

export type ShipmentItemInput = { productId: string; quantity: number };

export async function generateShipmentNumber(tx?: TxClient): Promise<string> {
  return nextBusinessNumber("shipment", { prefix: "SHP" }, tx);
}

/** Buyurtma bo'yicha (jo'natilmagan) qoldiqni mahsulot bo'yicha hisoblaydi. */
export function remainingToShip(
  orderItems: { productId: string; quantity: number }[],
  shipments: { status: ShipmentStatus; items: { productId: string; quantity: number }[] }[]
): Map<string, number> {
  const shippedByProduct = new Map<string, number>();
  for (const shipment of shipments) {
    if (shipment.status === "CANCELLED") continue;
    for (const item of shipment.items) {
      shippedByProduct.set(
        item.productId,
        (shippedByProduct.get(item.productId) ?? 0) + item.quantity
      );
    }
  }

  const remaining = new Map<string, number>();
  for (const item of orderItems) {
    const left = item.quantity - (shippedByProduct.get(item.productId) ?? 0);
    if (left > 0) remaining.set(item.productId, left);
  }
  return remaining;
}

/**
 * Buyurtmadan jo'natma yaratadi. items berilsa — qisman jo'natma (bir
 * buyurtmadan bir nechta jo'natma). Berilmasa — buyurtmada qolgan qoldiq.
 *
 * `tx` berilsa — shu tranzaksiya ichida bajariladi (atomiklik uchun).
 */
export async function createShipmentFromOrder(
  orderId: string,
  actorId?: string | null,
  options: { items?: ShipmentItemInput[]; note?: string | null; warehouseId?: string | null } = {},
  tx?: TxClient
) {
  const run = async (client: TxClient) => {
    const order = await client.order.findUniqueOrThrow({
      where: { id: orderId },
      include: { items: true, shipments: { include: { items: true } } },
    });

    if (["DRAFT", "CANCELLED", "SHIPPED", "COMPLETED"].includes(order.status)) {
      throw new Error(
        `Jo'natma faqat CONFIRMED/PROCESSING/READY_TO_SHIP holatidagi buyurtmadan yaratiladi (hozirgi: ${order.status}).`
      );
    }

    const remaining = remainingToShip(order.items, order.shipments);

    const requested: ShipmentItemInput[] =
      options.items ??
      Array.from(remaining.entries()).map(([productId, quantity]) => ({
        productId,
        quantity,
      }));

    if (requested.length === 0) {
      throw new Error("Bu buyurtma bo'yicha jo'natiladigan qoldiq qolmagan.");
    }

    const orderQtyByProduct = new Map(order.items.map((i) => [i.productId, i.quantity]));

    for (const item of requested) {
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        throw new Error("Jo'natma miqdori musbat butun son bo'lishi kerak.");
      }
      if (!orderQtyByProduct.has(item.productId)) {
        throw new Error("Mahsulot bu buyurtmada yo'q.");
      }
      const left = remaining.get(item.productId) ?? 0;
      if (item.quantity > left) {
        throw new Error(`Miqdor buyurtmadan ortiq: jo'natiladigan qoldiq ${left}.`);
      }
    }

    const shipment = await client.shipment.create({
      data: {
        number: await generateShipmentNumber(client),
        orderId,
        warehouseId:
          options.warehouseId ?? order.warehouseId ?? (await getMainWarehouseId(client)),
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
      client
    );

    return shipment;
  };

  return tx ? run(tx) : prisma.$transaction(run);
}

/**
 * Jo'natmani qayd etish (yozish): zaxira yopiladi, jismoniy qoldiq
 * kamayadi. Tranzaksiya ichida, idempotent — `stockAppliedAt` orqali
 * bir jo'natma faqat bir marta yoziladi.
 */
export async function postShipment(
  shipmentId: string,
  actorId?: string | null,
  tx?: TxClient
) {
  const run = async (client: TxClient) => {
    const shipment = await client.shipment.findUniqueOrThrow({
      where: { id: shipmentId },
      include: {
        items: true,
        order: { include: { items: true, shipments: { include: { items: true } } } },
      },
    });

    if (shipment.status === "SHIPPED" || shipment.status === "DELIVERED") {
      throw new Error("Jo'natma allaqachon jo'natilgan.");
    }
    if (shipment.status === "CANCELLED") {
      throw new Error("Bekor qilingan jo'natmani jo'natib bo'lmaydi.");
    }

    // Buyurtma qatorini bloklaymiz — parallel jo'natmalar bir-birini
    // kutadi (ikki marta yozishning oldini oladi).
    await client.$executeRaw`SELECT id FROM "Order" WHERE id = ${shipment.orderId} FOR UPDATE`;

    // Idempotentlik: bu jo'natma uchun qoldiq allaqachon yozilganmi?
    if (shipment.stockAppliedAt !== null) {
      throw new Error("Bu jo'natma uchun ombor qoldig'i allaqachon yozilgan.");
    }

    const warehouseId = shipment.warehouseId ?? (await getMainWarehouseId(client));

    // Mahsulotlar `productId` bo'yicha tartiblangan — barcha tranzaksiyalar
    // bir xil tartibda bloklaydi (deadlock himoyasi).
    const items = [...shipment.items].sort((a, b) =>
      a.productId < b.productId ? -1 : a.productId > b.productId ? 1 : 0
    );

    for (const item of items) {
      // Zaxira yopiladi (band bo'lgan miqdor bo'shatiladi).
      await releaseStock(client, {
        productId: item.productId,
        warehouseId,
        quantity: item.quantity,
        allowOverRelease: true,
      });
      // Jismoniy qoldiq kamayadi.
      await recordStockChange(client, {
        productId: item.productId,
        warehouseId,
        change: -item.quantity,
        reason: "ISSUE",
        note: `Jo'natma ${shipment.number} (buyurtma ${shipment.order.number})`,
        referenceType: "Shipment",
        referenceId: shipment.id,
        createdBy: actorId ?? null,
      });
    }

    // Sotuvlar hisobga olinadi.
    for (const item of items) {
      await client.product.update({
        where: { id: item.productId },
        data: { soldCount: { increment: item.quantity } },
      });
    }

    await client.shipment.update({
      where: { id: shipmentId },
      data: { status: "SHIPPED", shippedAt: new Date(), stockAppliedAt: new Date() },
    });

    // Buyurtma holati — qolgan mahsulotlar bo'yicha.
    const orderWithShipments = await client.order.findUniqueOrThrow({
      where: { id: shipment.orderId },
      include: { items: true, shipments: { include: { items: true } } },
    });
    const left = remainingToShip(orderWithShipments.items, orderWithShipments.shipments);
    const fullyShipped = left.size === 0;

    await client.order.update({
      where: { id: shipment.orderId },
      data: {
        status: fullyShipped ? "SHIPPED" : orderWithShipments.status,
        stockDeductedAt: fullyShipped
          ? (orderWithShipments.stockDeductedAt ?? new Date())
          : null,
        stockReservedAt: fullyShipped ? null : orderWithShipments.stockReservedAt,
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
      client
    );
  };

  return tx ? run(tx) : prisma.$transaction(run);
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

/**
 * Yetkazildi deb belgilash — buyurtma to'liq jo'natilgan bo'lsa COMPLETED'ga
 * o'tadi.
 */
export async function deliverShipment(shipmentId: string, actorId?: string | null) {
  await prisma.$transaction(async (tx) => {
    const shipment = await tx.shipment.findUniqueOrThrow({
      where: { id: shipmentId },
      include: { order: { include: { items: true, shipments: { include: { items: true } } } } },
    });
    if (shipment.status !== "SHIPPED") {
      throw new Error("Faqat jo'natilgan jo'natmani yetkazilgan deb belgilash mumkin.");
    }
    await tx.shipment.update({
      where: { id: shipmentId },
      data: { status: "DELIVERED", deliveredAt: new Date() },
    });

    const left = remainingToShip(shipment.order.items, shipment.order.shipments);
    if (left.size === 0) {
      await tx.order.update({
        where: { id: shipment.orderId },
        data: { status: "COMPLETED" },
      });
    }

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
