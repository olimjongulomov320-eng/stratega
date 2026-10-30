"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAction, audit, safe, str, nextNumber, type ActionState } from "@/lib/admin";
import { customerFromRfq, resolvePrices } from "@/lib/sales";
import type { RfqStatus } from "@/generated/prisma/client";

const STATUSES: RfqStatus[] = ["NEW", "IN_REVIEW", "QUOTED", "CONFIRMED", "CANCELLED"];

export async function setRfqStatus(_: ActionState, form: FormData): Promise<ActionState> {
  return safe(async () => {
    const session = await requireAction("orders.write");
    const id = str(form, "id");
    const status = str(form, "status") as RfqStatus;
    if (!STATUSES.includes(status)) throw new Error("Noto'g'ri holat.");
    await prisma.rfqRequest.update({ where: { id }, data: { status } });
    await audit(session, "Ariza holati o'zgardi", "RfqRequest", id, { status });
    revalidatePath("/admin/requests");
  });
}

export async function quoteFromRfq(_: ActionState, form: FormData): Promise<ActionState> {
  let quotationId = "";
  const res = await safe(async () => {
    const session = await requireAction("orders.write");
    const id = str(form, "id");
    await prisma.$transaction(async (tx) => {
      const rfq = await tx.rfqRequest.findUnique({ where: { id }, include: { items: true } });
      if (!rfq) throw new Error("Ariza topilmadi.");
      const customer = await customerFromRfq(tx, rfq);
      const lines = await resolvePrices(tx, customer.id, rfq.items.map((i) => ({ productId: i.productId, quantity: i.quantity })));
      const q = await tx.quotation.create({
        data: {
          number: await nextNumber("KP", tx),
          customerId: customer.id,
          rfqRequestId: rfq.id,
          validUntil: new Date(Date.now() + 14 * 86400000),
          note: [rfq.requestType, rfq.comment].filter(Boolean).join(" — ") || null,
          total: lines.reduce((s, l) => s + l.price * l.quantity, 0),
          createdBy: session.name,
          lines: { create: lines.map((l) => ({ productId: l.productId, quantity: l.quantity, price: l.price })) },
        },
      });
      quotationId = q.id;
      if (rfq.status === "NEW") await tx.rfqRequest.update({ where: { id }, data: { status: "IN_REVIEW" } });
    });
    await audit(session, "Taklif yaratildi (arizadan)", "Quotation", quotationId, { rfq: id });
  });
  if (res?.error) return res;
  redirect(`/admin/quotations/${quotationId}`);
}
