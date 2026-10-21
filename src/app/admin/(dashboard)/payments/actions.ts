"use server";

import { revalidatePath } from "next/cache";
import { getCurrentEmployee } from "@/lib/employee-auth";
import { requireAdminPermission } from "@/lib/require-permission";
import { recordPayment, refundPayment, type RecordPaymentInput } from "@/lib/payments";

export type PaymentActionResult =
  | { ok: true; id?: string }
  | { ok: false; error: string };

async function getActorId(): Promise<string | null> {
  const employee = await getCurrentEmployee();
  return employee?.id ?? null;
}

function handle(err: unknown): { ok: false; error: string } {
  return { ok: false, error: err instanceof Error ? err.message : String(err) };
}

export async function recordPaymentAction(
  orderId: string,
  input: RecordPaymentInput
): Promise<PaymentActionResult> {
  await requireAdminPermission("finance.write");
  const actorId = await getActorId();
  try {
    const payment = await recordPayment(orderId, input, actorId);
    revalidatePath("/admin/payments");
    revalidatePath(`/admin/orders/${orderId}`);
    return { ok: true, id: payment.id };
  } catch (err) {
    return handle(err);
  }
}

export async function refundPaymentAction(paymentId: string): Promise<PaymentActionResult> {
  await requireAdminPermission("finance.write");
  const actorId = await getActorId();
  try {
    const payment = await refundPayment(paymentId, actorId);
    revalidatePath("/admin/payments");
    revalidatePath(`/admin/orders/${payment.orderId}`);
    return { ok: true, id: payment.id };
  } catch (err) {
    return handle(err);
  }
}
