"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { recordStockChange } from "@/lib/stock";
import { requireAdminPermission } from "@/lib/require-permission";
import { writeAuditLog, actorContext } from "@/lib/audit";
import { getMainWarehouseId } from "@/lib/warehouse";

export type AdjustStockResult =
  | { ok: true; stockAfter: number }
  | { ok: false; error: string };

/**
 * Ombor qoldig'ini qo'lda tuzatadi.
 *
 * MUHIM: tuzatish ALMASHUV omborning balansi bo'yicha hisoblanadi —
 * barcha omborlar yig'indisi (Product.stock) bo'yicha emas. Aks holda
 * ko'p omborli tizimda "Ombor A = 10" ni "Ombor B = 5" qilib
 * o'zgartirish A omboridagi 5 donani yo'qotardi.
 */
export async function adjustStock(
  productId: string,
  newStock: number,
  warehouseId?: string | null
): Promise<AdjustStockResult> {
  await requireAdminPermission("stock.write");
  const actor = await actorContext();

  if (!Number.isInteger(newStock) || newStock < 0) {
    return { ok: false, error: "Noto'g'ri qiymat." };
  }

  const stockAfter = await prisma.$transaction(async (tx) => {
    const targetWarehouseId = warehouseId ?? (await getMainWarehouseId(tx));

    const warehouse = await tx.warehouse.findUnique({
      where: { id: targetWarehouseId },
      select: { id: true, name: true },
    });
    if (!warehouse) {
      throw new Error("Ombor topilmadi.");
    }

    // Shu ombordagi joriy balans (barcha omborlar yig'indisi emas).
    const stockRow = await tx.stock.findUnique({
      where: { productId_warehouseId: { productId, warehouseId: targetWarehouseId } },
      select: { id: true, quantity: true, reserved: true },
    });
    const currentQuantity = stockRow?.quantity ?? 0;

    const delta = newStock - currentQuantity;
    if (delta === 0) return currentQuantity;

    // Band (reserved) miqdordan pastga tushirish mumkin emas —
    // aks holda buyurtmalar uchun bandlangan tovar "yo'qoladi".
    if (newStock < (stockRow?.reserved ?? 0)) {
      throw new Error(
        `Bu omborda ${stockRow?.reserved ?? 0} dona buyurtmalar uchun band qilingan. Avval bandlangan buyurtmalarni bekor qiling.`
      );
    }

    const result = await recordStockChange(tx, {
      productId,
      warehouseId: targetWarehouseId,
      change: delta,
      reason: "MANUAL",
      note: `Qo'lda tuzatish (${warehouse.name}): ${currentQuantity} → ${newStock}`,
      createdBy: actor.actorId,
    });

    await writeAuditLog(
      {
        ...actor,
        action: "stock.adjust",
        entity: "Stock",
        entityId: productId,
        oldData: { warehouseId: targetWarehouseId, quantity: currentQuantity },
        newData: { warehouseId: targetWarehouseId, quantity: newStock },
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
