"use server";

import { revalidatePath } from "next/cache";
import { getCurrentEmployee } from "@/lib/employee-auth";
import { requireAdminPermission } from "@/lib/require-permission";
import {
  refreshAlerts,
  markAlertRead,
  resolveAlertManually,
} from "@/lib/alerts";
import { writeAuditLog } from "@/lib/audit";

export type AlertActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string };

function handle(err: unknown): { ok: false; error: string } {
  return { ok: false, error: err instanceof Error ? err.message : String(err) };
}

export async function refreshAlertsAction(): Promise<AlertActionResult> {
  await requireAdminPermission("stock.read");
  try {
    const result = await refreshAlerts();
    revalidatePath("/admin/alerts");
    return {
      ok: true,
      message: `${result.created} yangi, ${result.resolved} hal qilingan.`,
    };
  } catch (err) {
    return handle(err);
  }
}

export async function markAlertReadAction(alertId: string): Promise<AlertActionResult> {
  await requireAdminPermission("stock.read");
  try {
    await markAlertRead(alertId);
    revalidatePath("/admin/alerts");
    return { ok: true };
  } catch (err) {
    return handle(err);
  }
}

export async function resolveAlertAction(alertId: string): Promise<AlertActionResult> {
  await requireAdminPermission("stock.write");
  const employee = await getCurrentEmployee();
  try {
    await resolveAlertManually(alertId, employee?.id ?? null);
    await writeAuditLog({
      actorId: employee?.id ?? null,
      action: "alert.resolve",
      entity: "Alert",
      entityId: alertId,
    });
    revalidatePath("/admin/alerts");
    return { ok: true };
  } catch (err) {
    return handle(err);
  }
}
