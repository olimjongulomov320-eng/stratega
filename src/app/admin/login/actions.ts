"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createAdminSession, clearAdminSession, verifySharedAdminPassword } from "@/lib/admin-auth";
import { verifyPassword } from "@/lib/password";
import { rateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";
import type { ActionState } from "@/lib/admin-types";

export async function login(_: ActionState, form: FormData): Promise<ActionState> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  if (!rateLimit(`admin-login:${ip}`, 10, 15 * 60 * 1000)) return { error: "Juda ko'p urinish. 15 daqiqadan so'ng qayta urinib ko'ring." };

  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  if (!password) return { error: "Parolni kiriting." };

  if (email) {
    const employee = await prisma.employee.findUnique({ where: { email } });
    if (!employee || !employee.isActive || !verifyPassword(password, employee.passwordHash)) {
      return { error: "Email yoki parol noto'g'ri." };
    }
    await prisma.employee.update({ where: { id: employee.id }, data: { lastLoginAt: new Date() } });
    await prisma.auditLog.create({ data: { action: "auth.login", actor: employee.name, actorId: employee.id, entityType: "Employee", entityId: employee.id } });
    await createAdminSession({ employeeId: employee.id, name: employee.name, role: employee.role });
  } else {
    if (!verifySharedAdminPassword(password)) return { error: "Parol noto'g'ri." };
    await prisma.auditLog.create({ data: { action: "auth.login", actor: "admin (umumiy parol)" } });
    await createAdminSession({ employeeId: null, name: "Admin", role: "OWNER" });
  }
  redirect("/admin");
}

export async function logoutAdmin() {
  await clearAdminSession();
  redirect("/admin/login");
}
