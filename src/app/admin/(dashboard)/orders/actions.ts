"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getCurrentEmployee } from "@/lib/employee-auth";
import {
  createOrder,
  updateOrderStatus,
  type CreateOrderInput,
} from "@/lib/orders";
import type { OrderStatus } from "@/generated/prisma/client";

export type OrderActionResult = { ok: true } | { ok: false; error: string };

async function requireAdmin(): Promise<string | null> {
  if (!(await isAdminAuthenticated())) {
    throw new Error("Unauthorized");
  }
  const employee = await getCurrentEmployee();
  return employee?.id ?? null;
}

export async function createOrderAction(
  input: CreateOrderInput
): Promise<OrderActionResult> {
  const actorId = await requireAdmin();

  let orderId: string;
  try {
    const order = await createOrder(input, actorId);
    orderId = order.id;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }

  revalidatePath("/admin/orders");
  redirect(`/admin/orders/${orderId}`);
}

export async function setOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<OrderActionResult> {
  const actorId = await requireAdmin();

  try {
    await updateOrderStatus(orderId, status, actorId);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/stock");
  revalidatePath("/admin/products");
  return { ok: true };
}
