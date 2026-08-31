"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { requireAdminPermission } from "@/lib/require-permission";

export type WarehouseFormResult = { ok: true } | { ok: false; error: string };

export type WarehouseInput = {
  name: string;
  code: string;
  address: string;
  description: string;
  isActive: boolean;
};

export async function createWarehouse(
  input: WarehouseInput
): Promise<WarehouseFormResult> {
  await requireAdminPermission("stock.write");

  const name = input.name.trim();
  const code = input.code.trim().toUpperCase();
  if (!name) return { ok: false, error: "Ombor nomini kiriting." };
  if (!code) return { ok: false, error: "Ombor kodini kiriting." };

  const existing = await prisma.warehouse.findUnique({ where: { code } });
  if (existing) {
    return { ok: false, error: "Bu kod bilan ombor allaqachon mavjud." };
  }

  const warehouse = await prisma.warehouse.create({
    data: {
      name,
      code,
      address: input.address.trim() || null,
      description: input.description.trim() || null,
      isActive: input.isActive,
    },
  });

  await writeAuditLog({
    action: "warehouse.create",
    entity: "Warehouse",
    entityId: warehouse.id,
    newData: { name: warehouse.name, code: warehouse.code },
  });

  revalidatePath("/admin/warehouses");
  redirect("/admin/warehouses");
}

export async function updateWarehouse(
  warehouseId: string,
  input: WarehouseInput
): Promise<WarehouseFormResult> {
  await requireAdminPermission("stock.write");

  const name = input.name.trim();
  if (!name) return { ok: false, error: "Ombor nomini kiriting." };

  await prisma.warehouse.update({
    where: { id: warehouseId },
    data: {
      name,
      address: input.address.trim() || null,
      description: input.description.trim() || null,
      isActive: input.isActive,
    },
  });

  await writeAuditLog({
    action: "warehouse.update",
    entity: "Warehouse",
    entityId: warehouseId,
    newData: { name },
  });

  revalidatePath("/admin/warehouses");
  redirect("/admin/warehouses");
}
