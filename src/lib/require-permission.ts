import { isSharedAdminSession } from "@/lib/admin-auth";
import { requirePermissionOrAdmin } from "@/lib/employee-auth";
import type { Permission } from "@/lib/permissions";

// Barcha admin Server Action'lari uchun yagona ruxsat tekshiruvi.
// Eski umumiy parol orqali kirilganda — to'liq ruxsat (OWNER darajasida).
// Yangi Employee tizimi orqali kirilganda — haqiqiy rol/ruxsat tekshiriladi.
// Hech biri bo'lmasa — Error tashlanadi (Unauthorized).
export async function requireAdminPermission(
  permission: Permission
): Promise<void> {
  const sharedAdmin = await isSharedAdminSession();
  await requirePermissionOrAdmin(permission, sharedAdmin);
}
