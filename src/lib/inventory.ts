import "server-only";
import type { Prisma, StockMoveReason } from "@/generated/prisma/client";

type Tx = Prisma.TransactionClient;

/** Change on-hand stock in one warehouse and write a ledger row. Keeps Product.stock in sync. */
export async function moveStock(
  tx: Tx,
  opts: {
    productId: string;
    warehouseId: string;
    delta: number;
    reason: StockMoveReason;
    note?: string | null;
    documentId?: string;
    shipmentId?: string;
    actor?: string;
    allowNegative?: boolean;
  }
) {
  if (opts.delta === 0) return;
  await tx.stockLevel.upsert({
    where: { productId_warehouseId: { productId: opts.productId, warehouseId: opts.warehouseId } },
    create: { productId: opts.productId, warehouseId: opts.warehouseId, quantity: 0 },
    update: {},
  });
  // Atomic increment (row-locked by Postgres) — two parallel transactions can't
  // both read the same old balance and overwrite each other ("lost update").
  const level = await tx.stockLevel.update({
    where: { productId_warehouseId: { productId: opts.productId, warehouseId: opts.warehouseId } },
    data: { quantity: { increment: opts.delta } },
  });
  const balance = level.quantity;
  if (balance < 0 && !opts.allowNegative) {
    const product = await tx.product.findUnique({ where: { id: opts.productId }, select: { name: true } });
    // Throwing rolls the whole transaction back, including the increment above.
    throw new Error(`Qoldiq yetarli emas: ${product?.name ?? opts.productId} (mavjud ${balance - opts.delta}, kerak ${-opts.delta}).`);
  }
  await tx.stockMove.create({
    data: {
      productId: opts.productId,
      warehouseId: opts.warehouseId,
      delta: opts.delta,
      balanceAfter: balance,
      reason: opts.reason,
      note: opts.note ?? null,
      documentId: opts.documentId,
      shipmentId: opts.shipmentId,
      actor: opts.actor,
    },
  });
  await syncProductStock(tx, opts.productId);
}

export async function syncProductStock(tx: Tx, productId: string) {
  const agg = await tx.stockLevel.aggregate({ where: { productId }, _sum: { quantity: true } });
  await tx.product.update({ where: { id: productId }, data: { stock: agg._sum.quantity ?? 0 } });
}

/** Reserve (positive) or release (negative) stock for confirmed orders. */
export async function reserve(tx: Tx, productId: string, warehouseId: string, qty: number, allowOver = false) {
  if (qty === 0) return;
  await tx.stockLevel.upsert({
    where: { productId_warehouseId: { productId, warehouseId } },
    create: { productId, warehouseId, quantity: 0 },
    update: {},
  });
  if (qty < 0) {
    // Release: atomic and never below zero (an older order may release more than it reserved).
    await tx.$executeRaw`UPDATE "StockLevel" SET "reserved" = GREATEST("reserved" + ${qty}, 0), "updatedAt" = NOW() WHERE "productId" = ${productId} AND "warehouseId" = ${warehouseId}`;
    return;
  }
  // Atomic, like moveStock: parallel confirmations can't over-reserve.
  const level = await tx.stockLevel.update({
    where: { productId_warehouseId: { productId, warehouseId } },
    data: { reserved: { increment: qty } },
  });
  if (qty > 0 && !allowOver && level.reserved > level.quantity) {
    const product = await tx.product.findUnique({ where: { id: productId }, select: { name: true } });
    throw new Error(`Band qilish uchun qoldiq yetarli emas: ${product?.name ?? productId} (mavjud ${level.quantity - (level.reserved - qty)}).`);
  }
}

/** Post a stock document: applies every line to stock. */
export async function postStockDocument(tx: Tx, documentId: string, actor: string, allowNegative = false) {
  const doc = await tx.stockDocument.findUnique({ where: { id: documentId }, include: { lines: true } });
  if (!doc) throw new Error("Hujjat topilmadi.");
  if (doc.status !== "DRAFT") throw new Error("Faqat qoralama hujjatni o'tkazish mumkin.");
  if (doc.lines.length === 0) throw new Error("Hujjatda qatorlar yo'q.");

  for (const line of doc.lines) {
    const base = { productId: line.productId, documentId: doc.id, actor, note: doc.number, allowNegative };
    switch (doc.type) {
      case "RECEIPT":
        await moveStock(tx, { ...base, warehouseId: doc.warehouseId, delta: line.quantity, reason: "RECEIPT" });
        if (line.unitCost) await tx.product.update({ where: { id: line.productId }, data: { costPrice: line.unitCost } });
        break;
      case "RETURN":
        await moveStock(tx, { ...base, warehouseId: doc.warehouseId, delta: line.quantity, reason: "RETURN" });
        break;
      case "ISSUE":
        await moveStock(tx, { ...base, warehouseId: doc.warehouseId, delta: -line.quantity, reason: "ISSUE" });
        break;
      case "WRITE_OFF":
        await moveStock(tx, { ...base, warehouseId: doc.warehouseId, delta: -line.quantity, reason: "WRITE_OFF" });
        break;
      case "TRANSFER":
        if (!doc.targetWarehouseId || doc.targetWarehouseId === doc.warehouseId) throw new Error("Ko'chirish uchun boshqa omborni tanlang.");
        await moveStock(tx, { ...base, warehouseId: doc.warehouseId, delta: -line.quantity, reason: "TRANSFER_OUT" });
        await moveStock(tx, { ...base, warehouseId: doc.targetWarehouseId, delta: line.quantity, reason: "TRANSFER_IN" });
        break;
      case "INVENTORY": {
        const level = await tx.stockLevel.findUnique({
          where: { productId_warehouseId: { productId: line.productId, warehouseId: doc.warehouseId } },
        });
        const delta = line.quantity - (level?.quantity ?? 0);
        await moveStock(tx, { ...base, warehouseId: doc.warehouseId, delta, reason: "INVENTORY", allowNegative: true });
        break;
      }
    }
  }
  await tx.stockDocument.update({ where: { id: doc.id }, data: { status: "POSTED", postedAt: new Date() } });
}

/** Recompute order payment status from confirmed payments. */
export async function recomputeOrderPayment(tx: Tx, orderId: string) {
  const order = await tx.order.findUnique({ where: { id: orderId }, include: { payments: true } });
  if (!order) return;
  const paid = order.payments.filter((p) => p.status === "CONFIRMED").reduce((s, p) => s + p.amount, 0);
  const refunded = order.payments.filter((p) => p.status === "REFUNDED").reduce((s, p) => s + p.amount, 0);
  const net = paid - refunded;
  const paymentStatus =
    refunded > 0 && net <= 0 ? "REFUNDED" : net <= 0 ? "UNPAID" : net >= order.total ? "PAID" : "PARTIAL";
  await tx.order.update({ where: { id: orderId }, data: { paidAmount: net, paymentStatus } });
}
