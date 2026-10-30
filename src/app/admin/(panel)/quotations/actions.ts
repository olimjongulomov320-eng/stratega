"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAction, audit, safe, str, optStr, nextNumber, type ActionState } from "@/lib/admin";
import { parseLines } from "@/lib/lines";
import { resolvePrices } from "@/lib/sales";
import type { QuotationStatus } from "@/generated/prisma/client";
import { notifyOrderCreated } from "@/lib/telegram";

export async function createQuotation(_: ActionState, form: FormData): Promise<ActionState> {
  let id = "";
  const res = await safe(async () => {
    const session = await requireAction("orders.write");
    const customerId = optStr(form, "customerId");
    const lines = parseLines(form.get("lines"));
    if (lines.length === 0) throw new Error("Kamida bitta mahsulot qo'shing.");
    const priced = await resolvePrices(prisma, customerId, lines);
    const valid = str(form, "validUntil");
    const q = await prisma.$transaction(async (tx) =>
      tx.quotation.create({
        data: {
          number: await nextNumber("KP", tx),
          customerId,
          validUntil: valid ? new Date(valid) : new Date(Date.now() + 14 * 86400000),
          note: optStr(form, "note"),
          total: priced.reduce((s, l) => s + l.price * l.quantity, 0),
          createdBy: session.name,
          lines: { create: priced.map((l) => ({ productId: l.productId, quantity: l.quantity, price: l.price })) },
        },
      })
    );
    id = q.id;
    await audit(session, "Taklif yaratildi", "Quotation", id);
  });
  if (res?.error) return res;
  redirect(`/admin/quotations/${id}`);
}

export async function updateQuotation(_: ActionState, form: FormData): Promise<ActionState> {
  return safe(async () => {
    const session = await requireAction("orders.write");
    const id = str(form, "id");
    const q = await prisma.quotation.findUnique({ where: { id } });
    if (!q) throw new Error("Taklif topilmadi.");
    if (q.status !== "DRAFT") throw new Error("Faqat qoralama taklifni tahrirlash mumkin.");
    const customerId = optStr(form, "customerId");
    const lines = parseLines(form.get("lines"));
    if (lines.length === 0) throw new Error("Kamida bitta mahsulot qo'shing.");
    const priced = await resolvePrices(prisma, customerId, lines);
    const valid = str(form, "validUntil");
    await prisma.$transaction([
      prisma.quotationLine.deleteMany({ where: { quotationId: id } }),
      prisma.quotation.update({
        where: { id },
        data: {
          customerId,
          note: optStr(form, "note"),
          validUntil: valid ? new Date(valid) : null,
          total: priced.reduce((s, l) => s + l.price * l.quantity, 0),
          lines: { create: priced.map((l) => ({ productId: l.productId, quantity: l.quantity, price: l.price })) },
        },
      }),
    ]);
    await audit(session, "Taklif tahrirlandi", "Quotation", id);
    revalidatePath(`/admin/quotations/${id}`);
    return { ok: true, message: "Saqlandi." };
  });
}

export async function setQuotationStatus(_: ActionState, form: FormData): Promise<ActionState> {
  return safe(async () => {
    const session = await requireAction("orders.write");
    const id = str(form, "id");
    const status = str(form, "status") as QuotationStatus;
    const q = await prisma.quotation.update({ where: { id }, data: { status } });
    if (q.rfqRequestId && status === "SENT") await prisma.rfqRequest.update({ where: { id: q.rfqRequestId }, data: { status: "QUOTED" } });
    if (q.rfqRequestId && status === "REJECTED") await prisma.rfqRequest.update({ where: { id: q.rfqRequestId }, data: { status: "CANCELLED" } });
    await audit(session, "Taklif holati o'zgardi", "Quotation", id, { status });
    revalidatePath(`/admin/quotations/${id}`);
  });
}

export async function quotationToOrder(_: ActionState, form: FormData): Promise<ActionState> {
  let orderId = "";
  const res = await safe(async () => {
    const session = await requireAction("orders.write");
    const id = str(form, "id");
    await prisma.$transaction(async (tx) => {
      const q = await tx.quotation.findUnique({ where: { id }, include: { lines: { include: { product: true } }, order: true } });
      if (!q) throw new Error("Taklif topilmadi.");
      if (q.order) throw new Error(`Buyurtma allaqachon yaratilgan: ${q.order.number}`);
      const warehouse = (await tx.warehouse.findFirst({ where: { isDefault: true } })) ?? (await tx.warehouse.findFirst({ where: { isActive: true } }));
      if (!warehouse) throw new Error("Ombor yaratilmagan.");
      const order = await tx.order.create({
        data: {
          number: await nextNumber("ORD", tx),
          customerId: q.customerId,
          warehouseId: warehouse.id,
          quotationId: q.id,
          note: q.note,
          total: q.total,
          createdBy: session.name,
          lines: { create: q.lines.map((l) => ({ productId: l.productId, quantity: l.quantity, price: l.price, costPrice: l.product.costPrice })) },
        },
      });
      orderId = order.id;
      await tx.quotation.update({ where: { id }, data: { status: "ACCEPTED" } });
      if (q.rfqRequestId) await tx.rfqRequest.update({ where: { id: q.rfqRequestId }, data: { status: "CONFIRMED" } });
    });
    await audit(session, "Taklifdan buyurtma yaratildi", "Order", orderId, { quotation: id });
    await notifyOrderCreated(orderId);
  });
  if (res?.error) return res;
  redirect(`/admin/orders/${orderId}`);
}
