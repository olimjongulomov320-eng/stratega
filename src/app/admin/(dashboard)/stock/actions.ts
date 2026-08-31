"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { recordStockChange } from "@/lib/stock";

async function requireAdmin() {
  if (!(await isAdminAuthenticated())) {
    throw new Error("Unauthorized");
  }
}

export type AdjustStockResult =
  | { ok: true; stockAfter: number }
  | { ok: false; error: string };

export async function adjustStock(
  productId: string,
  newStock: number
): Promise<AdjustStockResult> {
  await requireAdmin();

  if (!Number.isInteger(newStock) || newStock < 0) {
    return { ok: false, error: "Noto'g'ri qiymat." };
  }

  const stockAfter = await prisma.$transaction(async (tx) => {
    const current = await tx.product.findUniqueOrThrow({
      where: { id: productId },
      select: { stock: true },
    });

    const delta = newStock - current.stock;
    if (delta === 0) return current.stock;

    const result = await recordStockChange(tx, {
      productId,
      change: delta,
      reason: "MANUAL",
    });
    return result.stockAfter;
  });

  revalidatePath("/admin/stock");
  revalidatePath("/admin/products");
  revalidatePath("/");

  return { ok: true, stockAfter };
}
