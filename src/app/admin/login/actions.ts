"use server";

import { verifyAdminPassword, createAdminSession } from "@/lib/admin-auth";
import {
  verifyPassword,
  createEmployeeSession,
} from "@/lib/employee-auth";
import { prisma } from "@/lib/prisma";

export type AdminLoginResult = { ok: true } | { ok: false; error: string };

// Email berilgan bo'lsa — Employee (xodim) tizimi orqali kirish, aks holda
// eski umumiy parol orqali kirish. Ikkalasi ham parallel ishlaydi.
export async function adminLogin(
  password: string,
  email?: string
): Promise<AdminLoginResult> {
  if (email) {
    const employee = await prisma.employee.findUnique({ where: { email } });
    if (!employee || !employee.isActive) {
      return { ok: false, error: "Email yoki parol noto'g'ri." };
    }
    const valid = await verifyPassword(password, employee.passwordHash);
    if (!valid) {
      return { ok: false, error: "Email yoki parol noto'g'ri." };
    }
    await createEmployeeSession(employee.id);
    return { ok: true };
  }

  if (!verifyAdminPassword(password)) {
    return { ok: false, error: "Parol noto'g'ri." };
  }

  await createAdminSession();
  return { ok: true };
}
