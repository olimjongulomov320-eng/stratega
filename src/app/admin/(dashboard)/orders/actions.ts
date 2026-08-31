"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentEmployee } from "@/lib/employee-auth";
import { requireAdminPermission } from "@/lib/require-permission";
import {
  createOrder,
  updateOrderStatus,
  type CreateOrderInput,
} from "@/lib/orders";
import type { OrderStatus } from "@/generated/prisma/client";

export type OrderActionResult = { ok: true } | { ok: false; error: string };

async function getActorId(): Promise<string | null> {
  const employee = await getCurrentEmployee();
  return employee?.id ?? null;
}

export async function createOrderAction(
  input: CreateOrderInput
): Promise<OrderActionResult> {
  await requireAdminPermission("orders.write");
  const actorId = await getActorId();

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
  await requireAdminPermission("orders.write");
  const actorId = await getActorId();

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
