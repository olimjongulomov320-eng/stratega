"use server";

import { revalidatePath } from "next/cache";
import { getCurrentEmployee } from "@/lib/employee-auth";
import { requireAdminPermission } from "@/lib/require-permission";
import {
  createShipmentFromOrder,
  postShipment,
  markShipmentReady,
  deliverShipment,
  cancelShipment,
  type ShipmentItemInput,
} from "@/lib/shipments";

export type ShipmentActionResult =
  | { ok: true; id?: string }
  | { ok: false; error: string };

async function getActorId(): Promise<string | null> {
  const employee = await getCurrentEmployee();
  return employee?.id ?? null;
}

function handle(err: unknown): { ok: false; error: string } {
  return { ok: false, error: err instanceof Error ? err.message : String(err) };
}

export async function createShipmentAction(
  orderId: string,
  options: { items?: ShipmentItemInput[]; note?: string | null; warehouseId?: string | null } = {}
): Promise<ShipmentActionResult> {
  await requireAdminPermission("orders.write");
  const actorId = await getActorId();
  try {
    const shipment = await createShipmentFromOrder(orderId, actorId, options);
    revalidatePath("/admin/shipments");
    revalidatePath(`/admin/orders/${orderId}`);
    return { ok: true, id: shipment.id };
  } catch (err) {
    return handle(err);
  }
}

export async function postShipmentAction(shipmentId: string): Promise<ShipmentActionResult> {
  await requireAdminPermission("stock.write");
  const actorId = await getActorId();
  try {
    await postShipment(shipmentId, actorId);
    revalidatePath("/admin/shipments");
    return { ok: true };
  } catch (err) {
    return handle(err);
  }
}

export async function markShipmentReadyAction(shipmentId: string): Promise<ShipmentActionResult> {
  await requireAdminPermission("orders.write");
  const actorId = await getActorId();
  try {
    await markShipmentReady(shipmentId, actorId);
    revalidatePath("/admin/shipments");
    return { ok: true };
  } catch (err) {
    return handle(err);
  }
}

export async function deliverShipmentAction(shipmentId: string): Promise<ShipmentActionResult> {
  await requireAdminPermission("orders.write");
  const actorId = await getActorId();
  try {
    await deliverShipment(shipmentId, actorId);
    revalidatePath("/admin/shipments");
    return { ok: true };
  } catch (err) {
    return handle(err);
  }
}

export async function cancelShipmentAction(shipmentId: string): Promise<ShipmentActionResult> {
  await requireAdminPermission("orders.write");
  const actorId = await getActorId();
  try {
    await cancelShipment(shipmentId, actorId);
    revalidatePath("/admin/shipments");
    return { ok: true };
  } catch (err) {
    return handle(err);
  }
}
