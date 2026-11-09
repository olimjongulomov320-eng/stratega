"use server";

import { revalidatePath } from "next/cache";
import { revalidateStorefront } from "@/lib/storefront-cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAction, audit, safe, str, optStr, int, nextNumber, type ActionState } from "@/lib/admin";
import { parseLines } from "@/lib/lines";
import { resolvePrices } from "@/lib/sales";
import { reserve, moveStock, recomputeOrderPayment } from "@/lib/inventory";
import { getSetting } from "@/lib/settings";
import type { PaymentMethod } from "@/generated/prisma/client";
import { notifyOrderCreated } from "@/lib/telegram";

export async function createOrder(_: ActionState, form: FormData): Promise<ActionState> {
  let id = "";
  const res = await safe(async () => {
    const session = await requireAction("orders.write");
    const customerId = optStr(form, "customerId");
    const warehouseId = str(form, "warehouseId");
    if (!warehouseId) throw new Error("Omborni tanlang.");
    const lines = parseLines(form.get("lines"));
    if (lines.length === 0) throw new Error("Kamida bitta mahsulot qo'shing.");
    const priced = await resolvePrices(prisma, customerId, lines);
    const order = await prisma.$transaction(async (tx) =>
      tx.order.create({
        data: {
          number: await nextNumber("ORD", tx),
          customerId,
          warehouseId,
          note: optStr(form, "note"),
          total: priced.reduce((s, l) => s + l.price * l.quantity, 0),
          createdBy: session.name,
          lines: { create: priced.map((l) => ({ productId: l.productId, quantity: l.quantity, price: l.price, costPrice: l.costPrice })) },
        },
      })
    );
    id = order.id;
    await audit(session, "Buyurtma yaratildi", "Order", id, { total: order.total });
    await notifyOrderCreated(id);
  });
  if (res?.error) return res;
  redirect(`/admin/orders/${id}`);
}

export async function updateOrderLines(_: ActionState, form: FormData): Promise<ActionState> {
  return safe(async () => {
    const session = await requireAction("orders.write");
    const id = str(form, "id");
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order || order.status !== "DRAFT") throw new Error("Faqat qoralama buyurtmani tahrirlash mumkin.");
    const customerId = optStr(form, "customerId");
    const lines = parseLines(form.get("lines"));
    if (lines.length === 0) throw new Error("Kamida bitta mahsulot qo'shing.");
    const priced = await resolvePrices(prisma, customerId, lines);
    await prisma.$transaction([
      prisma.orderLine.deleteMany({ where: { orderId: id } }),
      prisma.order.update({
        where: { id },
        data: {
          customerId,
          warehouseId: str(form, "warehouseId") || order.warehouseId,
          note: optStr(form, "note"),
          total: priced.reduce((s, l) => s + l.price * l.quantity, 0),
          lines: { create: priced.map((l) => ({ productId: l.productId, quantity: l.quantity, price: l.price, costPrice: l.costPrice })) },
        },
      }),
    ]);
    await audit(session, "Buyurtma tahrirlandi", "Order", id);
    revalidatePath(`/admin/orders/${id}`);
    return { ok: true, message: "Saqlandi." };
  });
}

export async function confirmOrder(_: ActionState, form: FormData): Promise<ActionState> {
  return safe(async () => {
    const session = await requireAction("orders.write");
    const id = str(form, "id");
    const allowOver = await getSetting<boolean>("stock.allowOverReserve");
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id }, include: { lines: { include: { product: true } }, customer: true, payments: true } });
      if (!order) throw new Error("Buyurtma topilmadi.");
      if (order.status !== "DRAFT") throw new Error("Buyurtma allaqachon tasdiqlangan.");
      for (const l of order.lines) await reserve(tx, l.productId, order.warehouseId, l.quantity, allowOver);
      // Snapshot cost at confirmation for margin reports.
      for (const l of order.lines) await tx.orderLine.update({ where: { id: l.id }, data: { costPrice: l.product.costPrice } });
      await tx.order.update({ where: { id }, data: { status: "CONFIRMED", confirmedAt: new Date() } });
    });
    await audit(session, "Buyurtma tasdiqlandi (band qilindi)", "Order", id);
    revalidatePath("/admin", "layout");
    return { ok: true, message: "Tasdiqlandi — mahsulotlar band qilindi." };
  });
}

export async function cancelOrder(_: ActionState, form: FormData): Promise<ActionState> {
  return safe(async () => {
    const session = await requireAction("orders.write");
    const id = str(form, "id");
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id }, include: { lines: true, shipments: true } });
      if (!order) throw new Error("Buyurtma topilmadi.");
      if (order.status === "CANCELLED") return;
      if (order.shipments.some((s) => s.status === "SHIPPED" || s.status === "DELIVERED")) {
        throw new Error("Jo'natilgan buyurtmani bekor qilib bo'lmaydi — qaytarish hujjatini yarating.");
      }
      if (order.status === "CONFIRMED") {
        for (const l of order.lines) await reserve(tx, l.productId, order.warehouseId, -l.quantity);
      }
      await tx.shipment.updateMany({ where: { orderId: id, status: { in: ["DRAFT", "READY"] } }, data: { status: "CANCELLED" } });
      await tx.order.update({ where: { id }, data: { status: "CANCELLED" } });
    });
    await audit(session, "Buyurtma bekor qilindi", "Order", id);
    revalidatePath("/admin", "layout");
  });
}

export async function completeOrder(_: ActionState, form: FormData): Promise<ActionState> {
  return safe(async () => {
    const session = await requireAction("orders.write");
    const id = str(form, "id");
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order || order.status !== "SHIPPED") throw new Error("Faqat jo'natilgan buyurtmani yakunlash mumkin.");
    await prisma.order.update({ where: { id }, data: { status: "COMPLETED" } });
    await audit(session, "Buyurtma yakunlandi", "Order", id);
    revalidatePath(`/admin/orders/${id}`);
  });
}

export async function createShipment(_: ActionState, form: FormData): Promise<ActionState> {
  let shipmentId = "";
  const res = await safe(async () => {
    const session = await requireAction("stock.write");
    const id = str(form, "id");
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id }, include: { lines: true, shipments: { include: { lines: true } } } });
      if (!order) throw new Error("Buyurtma topilmadi.");
      if (order.status !== "CONFIRMED") throw new Error("Jo'natma faqat tasdiqlangan buyurtma uchun.");
      const shipped = new Map<string, number>();
      for (const s of order.shipments.filter((s) => s.status !== "CANCELLED")) for (const l of s.lines) shipped.set(l.productId, (shipped.get(l.productId) ?? 0) + l.quantity);
      const remaining = order.lines.map((l) => ({ productId: l.productId, quantity: l.quantity - (shipped.get(l.productId) ?? 0) })).filter((l) => l.quantity > 0);
      if (remaining.length === 0) throw new Error("Barcha mahsulotlar jo'natmaga kiritilgan.");
      const s = await tx.shipment.create({
        data: { number: await nextNumber("SHP", tx), orderId: id, warehouseId: order.warehouseId, address: optStr(form, "address"), lines: { create: remaining } },
      });
      shipmentId = s.id;
    });
    await audit(session, "Jo'natma yaratildi", "Shipment", shipmentId, { order: id });
  });
  if (res?.error) return res;
  redirect(`/admin/shipments/${shipmentId}`);
}

export async function recordPayment(_: ActionState, form: FormData): Promise<ActionState> {
  return safe(async () => {
    const session = await requireAction("finance.write");
    const orderId = str(form, "orderId");
    const amount = int(form, "amount");
    if (!orderId) throw new Error("Buyurtmani tanlang.");
    if (!amount || amount <= 0) throw new Error("Summani kiriting.");
    const method = (str(form, "method") || "BANK_TRANSFER") as PaymentMethod;
    const refund = str(form, "kind") === "refund";
    const paidAt = str(form, "paidAt");
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId } });
      if (!order) throw new Error("Buyurtma topilmadi.");
      if (order.status === "DRAFT" || order.status === "CANCELLED") throw new Error("To'lov faqat tasdiqlangan buyurtma uchun.");
      await tx.payment.create({
        data: {
          orderId,
          amount,
          method,
          status: refund ? "REFUNDED" : "CONFIRMED",
          reference: optStr(form, "reference"),
          note: optStr(form, "note"),
          paidAt: paidAt ? new Date(paidAt) : new Date(),
          createdBy: session.name,
        },
      });
      await recomputeOrderPayment(tx, orderId);
    });
    await audit(session, refund ? "Pul qaytarildi" : "To'lov qabul qilindi", "Order", orderId, { amount, method });
    revalidatePath("/admin", "layout");
    return { ok: true, message: refund ? "Qaytarish qayd etildi." : "To'lov qayd etildi." };
  });
}

export async function deletePayment(_: ActionState, form: FormData): Promise<ActionState> {
  return safe(async () => {
    const session = await requireAction("finance.write");
    const id = str(form, "id");
    const p = await prisma.payment.delete({ where: { id } });
    await prisma.$transaction((tx) => recomputeOrderPayment(tx, p.orderId));
    await audit(session, "To'lov o'chirildi", "Payment", id, { amount: p.amount, order: p.orderId });
    revalidatePath("/admin", "layout");
  });
}

/** Used by shipments: ship goods (stock out + release reservation). */
export async function shipShipment(_: ActionState, form: FormData): Promise<ActionState> {
  return safe(async () => {
    const session = await requireAction("stock.write");
    const id = str(form, "id");
    const to = str(form, "to");
    await prisma.$transaction(async (tx) => {
      const s = await tx.shipment.findUnique({ where: { id }, include: { lines: true, order: { include: { lines: true, shipments: { include: { lines: true } } } } } });
      if (!s) throw new Error("Jo'natma topilmadi.");
      if (to === "READY") {
        if (s.status !== "DRAFT") throw new Error("Holat noto'g'ri.");
        await tx.shipment.update({ where: { id }, data: { status: "READY", assignee: optStr(form, "assignee") ?? s.assignee } });
        return;
      }
      if (to === "SHIPPED") {
        if (s.status !== "DRAFT" && s.status !== "READY") throw new Error("Bu jo'natma allaqachon jo'natilgan yoki bekor qilingan.");
        for (const l of s.lines) {
          await reserve(tx, l.productId, s.warehouseId, -l.quantity);
          await moveStock(tx, { productId: l.productId, warehouseId: s.warehouseId, delta: -l.quantity, reason: "SHIPMENT", shipmentId: s.id, note: `${s.number} / ${s.order.number}`, actor: session.name });
        }
        await tx.shipment.update({ where: { id }, data: { status: "SHIPPED", shippedAt: new Date() } });
        // Order fully shipped?
        const shippedQty = new Map<string, number>();
        for (const sh of s.order.shipments) {
          if (sh.id !== s.id && sh.status !== "SHIPPED" && sh.status !== "DELIVERED") continue;
          for (const l of sh.lines) shippedQty.set(l.productId, (shippedQty.get(l.productId) ?? 0) + l.quantity);
        }
        const done = s.order.lines.every((l) => (shippedQty.get(l.productId) ?? 0) >= l.quantity);
        if (done) await tx.order.update({ where: { id: s.orderId }, data: { status: "SHIPPED" } });
        return;
      }
      if (to === "DELIVERED") {
        if (s.status !== "SHIPPED") throw new Error("Avval jo'nating.");
        await tx.shipment.update({ where: { id }, data: { status: "DELIVERED", deliveredAt: new Date() } });
        return;
      }
      if (to === "CANCELLED") {
        if (s.status === "SHIPPED" || s.status === "DELIVERED") throw new Error("Jo'natilgan jo'natmani bekor qilib bo'lmaydi.");
        await tx.shipment.update({ where: { id }, data: { status: "CANCELLED" } });
        return;
      }
      throw new Error("Noma'lum amal.");
    });
    // Only shipping takes goods out of stock; reservations and the other statuses don't change what visitors see.
    if (to === "SHIPPED") revalidateStorefront();
    await audit(session, `Jo'natma: ${to}`, "Shipment", id);
    revalidatePath("/admin", "layout");
  });
}
