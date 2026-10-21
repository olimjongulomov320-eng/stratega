"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { recordStockChange } from "@/lib/stock";
import { requireAdminPermission } from "@/lib/require-permission";
import { writeAuditLog, actorContext } from "@/lib/audit";

export type AdjustStockResult =
  | { ok: true; stockAfter: number }
  | { ok: false; error: string };

export async function adjustStock(
  productId: string,
  newStock: number
): Promise<AdjustStockResult> {
  await requireAdminPermission("stock.write");
  const actor = await actorContext();

  if (!Number.isInteger(newStock) || newStock < 0) {
    return { ok: false, error: "Noto'g'ri qiymat." };
  }

  const stockAfter = await prisma.$transaction(async (tx) => {
    const current = await tx.product.findUniqueOrThrow({
      where: { id: productId },
      select: { stock: true, name: true },
    });

    const delta = newStock - current.stock;
    if (delta === 0) return current.stock;

    const result = await recordStockChange(tx, {
      productId,
      change: delta,
      reason: "MANUAL",
      note: `Qo'lda tuzatish: ${current.stock} → ${newStock}`,
      createdBy: actor.actorId,
    });

    await writeAuditLog(
      {
        ...actor,
        action: "stock.adjust",
        entity: "Product",
        entityId: productId,
        oldData: { stock: current.stock },
        newData: { stock: newStock },
      },
      tx
    );

    return result.stockAfter;
  });

  revalidatePath("/admin/stock");
  revalidatePath("/admin/products");
  revalidatePath("/");

  return { ok: true, stockAfter };
}
