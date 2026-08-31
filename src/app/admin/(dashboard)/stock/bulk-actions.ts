"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/require-permission";

export type BulkActionResult =
  | { ok: true; count: number }
  | { ok: false; error: string };

export async function bulkSetActive(
  productIds: string[],
  isActive: boolean
): Promise<BulkActionResult> {
  await requireAdminPermission("products.write");

  if (productIds.length === 0) {
    return { ok: false, error: "Hech narsa tanlanmagan." };
  }

  const result = await prisma.product.updateMany({
    where: { id: { in: productIds } },
    data: { isActive },
  });

  revalidatePath("/admin/stock");
  revalidatePath("/admin/products");
  revalidatePath("/");

  return { ok: true, count: result.count };
}
