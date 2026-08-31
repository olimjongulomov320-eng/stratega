"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { writeAuditLog } from "@/lib/audit";

export type SupplierFormResult = { ok: true } | { ok: false; error: string };

export type SupplierInput = {
  name: string;
  legalName: string;
  phone: string;
  email: string;
  contactName: string;
  address: string;
  taxId: string;
  notes: string;
  isActive: boolean;
};

async function requireAdmin() {
  if (!(await isAdminAuthenticated())) {
    throw new Error("Unauthorized");
  }
}

function toNullable(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export async function createSupplier(
  input: SupplierInput
): Promise<SupplierFormResult> {
  await requireAdmin();

  const name = input.name.trim();
  if (!name) return { ok: false, error: "Yetkazib beruvchi nomini kiriting." };

  const supplier = await prisma.supplier.create({
    data: {
      name,
      legalName: toNullable(input.legalName),
      phone: toNullable(input.phone),
      email: toNullable(input.email),
      contactName: toNullable(input.contactName),
      address: toNullable(input.address),
      taxId: toNullable(input.taxId),
      notes: toNullable(input.notes),
      isActive: input.isActive,
    },
  });

  await writeAuditLog({
    action: "supplier.create",
    entity: "Supplier",
    entityId: supplier.id,
    newData: { name: supplier.name },
  });

  revalidatePath("/admin/suppliers");
  redirect("/admin/suppliers");
}

export async function updateSupplier(
  supplierId: string,
  input: SupplierInput
): Promise<SupplierFormResult> {
  await requireAdmin();

  const name = input.name.trim();
  if (!name) return { ok: false, error: "Yetkazib beruvchi nomini kiriting." };

  await prisma.supplier.update({
    where: { id: supplierId },
    data: {
      name,
      legalName: toNullable(input.legalName),
      phone: toNullable(input.phone),
      email: toNullable(input.email),
      contactName: toNullable(input.contactName),
      address: toNullable(input.address),
      taxId: toNullable(input.taxId),
      notes: toNullable(input.notes),
      isActive: input.isActive,
    },
  });

  await writeAuditLog({
    action: "supplier.update",
    entity: "Supplier",
    entityId: supplierId,
    newData: { name },
  });

  revalidatePath("/admin/suppliers");
  redirect("/admin/suppliers");
}

export async function deleteSupplier(
  supplierId: string
): Promise<SupplierFormResult> {
  await requireAdmin();

  const docCount = await prisma.stockDocument.count({
    where: { supplierId },
  });
  if (docCount > 0) {
    return {
      ok: false,
      error: `Bu yetkazib beruvchi bilan ${docCount} ta hujjat bog'langan. O'chirib bo'lmaydi.`,
    };
  }

  await prisma.supplierProduct.deleteMany({ where: { supplierId } });
  await prisma.supplier.delete({ where: { id: supplierId } });

  await writeAuditLog({
    action: "supplier.delete",
    entity: "Supplier",
    entityId: supplierId,
  });

  revalidatePath("/admin/suppliers");
  return { ok: true };
}
