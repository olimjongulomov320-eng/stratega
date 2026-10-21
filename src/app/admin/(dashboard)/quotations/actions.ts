"use server";

import { revalidatePath } from "next/cache";
import { getCurrentEmployee } from "@/lib/employee-auth";
import { requireAdminPermission } from "@/lib/require-permission";
import {
  createQuotation,
  updateQuotationStatus,
  createOrderFromQuotation,
  type CreateQuotationInput,
} from "@/lib/quotations";
import type { QuotationStatus } from "@/generated/prisma/client";

export type QuotationActionResult =
  | { ok: true; id?: string }
  | { ok: false; error: string };

async function getActorId(): Promise<string | null> {
  const employee = await getCurrentEmployee();
  return employee?.id ?? null;
}

export async function createQuotationAction(
  input: CreateQuotationInput
): Promise<QuotationActionResult> {
  await requireAdminPermission("orders.write");
  const actorId = await getActorId();
  try {
    const quotation = await createQuotation(input, actorId);
    revalidatePath("/admin/quotations");
    return { ok: true, id: quotation.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function setQuotationStatusAction(
  quotationId: string,
  nextStatus: QuotationStatus
): Promise<QuotationActionResult> {
  await requireAdminPermission("orders.write");
  const actorId = await getActorId();
  try {
    await updateQuotationStatus(quotationId, nextStatus, actorId);
    revalidatePath("/admin/quotations");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function convertQuotationToOrderAction(
  quotationId: string
): Promise<QuotationActionResult> {
  await requireAdminPermission("orders.write");
  const actorId = await getActorId();
  try {
    const { orderId } = await createOrderFromQuotation(quotationId, actorId);
    revalidatePath("/admin/quotations");
    revalidatePath("/admin/orders");
    return { ok: true, id: orderId };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
