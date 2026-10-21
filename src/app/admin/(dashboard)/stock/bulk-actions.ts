"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/require-permission";
import { writeAuditLog, actorContext } from "@/lib/audit";

export type BulkActionResult =
  | { ok: true; count: number }
  | { ok: false; error: string };

export async function bulkSetActive(
  productIds: string[],
  isActive: boolean
): Promise<BulkActionResult> {
  await requireAdminPermission("products.write");
  const actor = await actorContext();

  if (productIds.length === 0) {
    return { ok: false, error: "Hech narsa tanlanmagan." };
  }
  if (productIds.length > 500) {
    return { ok: false, error: "Bir vaqtda ko'pi bilan 500 ta mahsulot." };
  }

  const result = await prisma.product.updateMany({
    where: { id: { in: productIds } },
    data: { isActive },
  });

  await writeAuditLog({
    ...actor,
    action: isActive ? "product.bulk_activate" : "product.bulk_deactivate",
    entity: "Product",
    entityId: productIds.join(","),
    newData: { count: result.count },
  });

  revalidatePath("/admin/stock");
  revalidatePath("/admin/products");
  revalidatePath("/");

  return { ok: true, count: result.count };
}
