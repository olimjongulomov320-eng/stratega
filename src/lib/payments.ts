import type { Prisma, PaymentStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";

type TxClient = Prisma.TransactionClient;

// To'lovlar (Payment) — buyurtma bo'yicha tushumlar. Har bir yozuv audit
// jurnaliga tushadi. Buyurtmaviy holat (PENDING/PARTIAL/PAID) to'lovlar
// yig'indisidan hisoblanadi, alohida "status" yozilmaydi.

export type RecordPaymentInput = {
  amount: number;
  method?: string | null;
  note?: string | null;
  receivedAt?: Date | null;
};

function computePaymentStatus(paidSum: number, orderTotal: number): PaymentStatus {
  if (paidSum <= 0) return "PENDING";
  if (paidSum >= orderTotal) return "PAID";
  return "PARTIAL";
}

export async function getOrderTotal(orderId: string): Promise<number> {
  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { items: { select: { price: true, quantity: true } } },
  });
  return order.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
}

export async function recordPayment(
  orderId: string,
  input: RecordPaymentInput,
  actorId?: string | null
) {
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error("To'lov miqdori musbat bo'lishi kerak.");
  }

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUniqueOrThrow({
      where: { id: orderId },
      include: { items: { select: { price: true, quantity: true } } },
    });

    const payment = await tx.payment.create({
      data: {
        orderId,
        customerId: order.customerId ?? null,
        amount: input.amount,
        method: input.method ?? null,
        note: input.note ?? null,
        receivedAt: input.receivedAt ?? new Date(),
        status: "PENDING", // vaqtinchalik, quyida yig'indi bo'yicha yangilanadi
      },
    });

    // Buyurtmaviy barcha to'lovlar yig'indisini qayta hisoblaymiz va
    // shu to'lov holatini yangilaymiz.
    const orderTotal = order.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const agg = await tx.payment.aggregate({
      where: { orderId, status: { in: ["PENDING", "PARTIAL", "PAID"] } },
      _sum: { amount: true },
    });
    const paidSum = agg._sum.amount ?? 0;
    const status = computePaymentStatus(paidSum, orderTotal);

    const updated = await tx.payment.update({
      where: { id: payment.id },
      data: { status },
    });

    await writeAuditLog(
      {
        actorId,
        action: "payment.record",
        entity: "Payment",
        entityId: payment.id,
        newData: {
          orderId,
          amount: input.amount,
          status,
          paidSum,
          orderTotal,
        },
      },
      tx
    );

    return updated;
  });
}

// To'lovni qaytarish (refund) — yozuv o'chirilmaydi, holati REFUNDED bo'ladi
// va tarix saqlanib qoladi.
export async function refundPayment(paymentId: string, actorId?: string | null) {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUniqueOrThrow({ where: { id: paymentId } });
    if (payment.status === "REFUNDED") {
      throw new Error("To'lov allaqachon qaytarilgan.");
    }

    const updated = await tx.payment.update({
      where: { id: paymentId },
      data: { status: "REFUNDED" },
    });

    // Buyurtmaviy yig'indini qayta hisoblab, qolgan to'lovlar holatini yangilaymiz.
    const order = await tx.order.findUniqueOrThrow({
      where: { id: payment.orderId },
      include: { items: { select: { price: true, quantity: true } } },
    });
    const orderTotal = order.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const agg = await tx.payment.aggregate({
      where: { orderId: payment.orderId, status: { in: ["PENDING", "PARTIAL", "PAID"] } },
      _sum: { amount: true },
    });
    const paidSum = agg._sum.amount ?? 0;
    const overall = computePaymentStatus(paidSum, orderTotal);

    await tx.payment.updateMany({
      where: {
        orderId: payment.orderId,
        status: { in: ["PENDING", "PARTIAL"] },
      },
      data: { status: overall === "PAID" ? "PARTIAL" : overall },
    });

    await writeAuditLog(
      {
        actorId,
        action: "payment.refund",
        entity: "Payment",
        entityId: paymentId,
        oldData: { status: payment.status },
        newData: { status: "REFUNDED", orderId: payment.orderId },
      },
      tx
    );

    return updated;
  });
}

export type PaymentSummary = {
  total: number;
  paid: number;
  outstanding: number;
  status: PaymentStatus | "UNPAID";
};

export async function getOrderPaymentSummaryDetailed(
  orderId: string,
  tx?: TxClient
): Promise<PaymentSummary> {
  const client = tx ?? prisma;
  const [order, agg] = await Promise.all([
    client.order.findUniqueOrThrow({
      where: { id: orderId },
      include: { items: { select: { price: true, quantity: true } } },
    }),
    client.payment.aggregate({
      where: { orderId, status: { in: ["PENDING", "PARTIAL", "PAID"] } },
      _sum: { amount: true },
    }),
  ]);
  const total = order.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const paid = agg._sum.amount ?? 0;
  return {
    total,
    paid,
    outstanding: total - paid,
    status: computePaymentStatus(paid, total),
  };
}
