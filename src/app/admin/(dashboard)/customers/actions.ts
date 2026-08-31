"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { requireAdminPermission } from "@/lib/require-permission";

export type CustomerFormResult = { ok: true } | { ok: false; error: string };

export type CustomerInput = {
  companyName: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
  taxId: string;
  notes: string;
  creditLimit: number | null;
  priceListId: string | null;
  isActive: boolean;
};

function toNullable(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export async function createCustomer(
  input: CustomerInput
): Promise<CustomerFormResult> {
  await requireAdminPermission("customers.write");

  const companyName = input.companyName.trim();
  if (!companyName) return { ok: false, error: "Kompaniya nomini kiriting." };

  const customer = await prisma.customer.create({
    data: {
      companyName,
      contactName: toNullable(input.contactName),
      phone: toNullable(input.phone),
      email: toNullable(input.email),
      address: toNullable(input.address),
      taxId: toNullable(input.taxId),
      notes: toNullable(input.notes),
      creditLimit: input.creditLimit,
      priceListId: input.priceListId,
      isActive: input.isActive,
    },
  });

  await writeAuditLog({
    action: "customer.create",
    entity: "Customer",
    entityId: customer.id,
    newData: { companyName: customer.companyName },
  });

  revalidatePath("/admin/customers");
  redirect("/admin/customers");
}

export async function updateCustomer(
  customerId: string,
  input: CustomerInput
): Promise<CustomerFormResult> {
  await requireAdminPermission("customers.write");

  const companyName = input.companyName.trim();
  if (!companyName) return { ok: false, error: "Kompaniya nomini kiriting." };

  await prisma.customer.update({
    where: { id: customerId },
    data: {
      companyName,
      contactName: toNullable(input.contactName),
      phone: toNullable(input.phone),
      email: toNullable(input.email),
      address: toNullable(input.address),
      taxId: toNullable(input.taxId),
      notes: toNullable(input.notes),
      creditLimit: input.creditLimit,
      priceListId: input.priceListId,
      isActive: input.isActive,
    },
  });

  await writeAuditLog({
    action: "customer.update",
    entity: "Customer",
    entityId: customerId,
    newData: { companyName },
  });

  revalidatePath("/admin/customers");
  redirect("/admin/customers");
}

export async function deleteCustomer(
  customerId: string
): Promise<CustomerFormResult> {
  await requireAdminPermission("customers.write");

  const orderCount = await prisma.order.count({ where: { customerId } });
  if (orderCount > 0) {
    return {
      ok: false,
      error: `Bu mijoz bilan ${orderCount} ta buyurtma bog'langan. O'chirib bo'lmaydi.`,
    };
  }

  await prisma.customer.delete({ where: { id: customerId } });

  await writeAuditLog({
    action: "customer.delete",
    entity: "Customer",
    entityId: customerId,
  });

  revalidatePath("/admin/customers");
  return { ok: true };
}
