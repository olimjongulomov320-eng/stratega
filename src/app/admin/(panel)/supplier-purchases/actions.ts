"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAction, audit, safe, str, int, type ActionState } from "@/lib/admin";

/** Records that a sold supplier-warehouse item was bought, with the price actually paid per unit. */
export async function markPurchased(_: ActionState, form: FormData): Promise<ActionState> {
  return safe(async () => {
    const session = await requireAction("orders.write");
    const id = str(form, "lineId");
    const cost = int(form, "purchaseCost");
    if (cost === null || cost <= 0) throw new Error("Sotib olish narxini kiriting (1 dona uchun, so'm).");
    // Only an unbought line of a sold order can be marked, so a retried click cannot overwrite a recorded price.
    const done = await prisma.orderLine.updateMany({
      where: { id, sourcing: "SUPPLIER_STOCK", purchasedAt: null, order: { status: { in: ["CONFIRMED", "SHIPPED", "COMPLETED"] } } },
      data: { purchasedAt: new Date(), purchaseCost: cost },
    });
    if (done.count === 0) throw new Error("Bu qator allaqachon sotib olingan yoki buyurtma bekor qilingan.");
    await audit(session, "Ta'minotchidan sotib olindi", "OrderLine", id, { purchaseCost: cost });
    revalidatePath("/admin/supplier-purchases");
    return { ok: true, message: "Sotib olindi deb belgilandi." };
  });
}
