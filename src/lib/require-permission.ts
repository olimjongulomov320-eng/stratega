import { redirect } from "next/navigation";
import { isSharedAdminSession } from "@/lib/admin-auth";
import { getCurrentEmployee, requirePermissionOrAdmin } from "@/lib/employee-auth";
import { roleHasPermission } from "@/lib/permissions";
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

// Sahifalar (server komponentlar) uchun ruxsat tekshiruvi. Muvaffaqiyatsiz
// bo'lsa "Ruxsat yo'q" sahifasiga yo'naltiradi — lekin autentifikatsiya
// tekshiruvi layout'da alohida bajariladi.
export async function requirePagePermission(permission: Permission): Promise<void> {
  const sharedAdmin = await isSharedAdminSession();
  if (sharedAdmin) return;

  const employee = await getCurrentEmployee();
  if (!employee || !roleHasPermission(employee.role, permission)) {
    redirect("/admin/no-access");
  }
}

// Sahifa uchun xavfsiz "kim ko'rishiga ruxsat bor" tekshiruvi (throw'siz).
export async function canReadPage(permission: Permission): Promise<boolean> {
  const sharedAdmin = await isSharedAdminSession();
  if (sharedAdmin) return true;
  const employee = await getCurrentEmployee();
  if (!employee) return false;
  return roleHasPermission(employee.role, permission);
}
