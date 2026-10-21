"use server";

import { headers } from "next/headers";
import { verifyAdminPassword, createAdminSession } from "@/lib/admin-auth";
import {
  verifyPassword,
  createEmployeeSession,
} from "@/lib/employee-auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { writeAuditLog } from "@/lib/audit";

export type AdminLoginResult = { ok: true } | { ok: false; error: string };

const LOGIN_LIMIT = 10;
const LOGIN_WINDOW_MS = 5 * 60 * 1000;

// Email berilgan bo'lsa — Employee (xodim) tizimi orqali kirish, aks holda
// eski umumiy parol orqali kirish. Ikkalasi ham parallel ishlaydi.
// Brute-force himoyasi: IP+email bo'yicha rate limit; muvaffaqiyatsiz
// urinishlar audit jurnaliga yoziladi.
export async function adminLogin(
  password: string,
  email?: string
): Promise<AdminLoginResult> {
  const headerStore = await headers();
  const ip = clientIp(headerStore);
  const key = `admin-login:${ip}:${email ?? "shared"}`;

  const limit = rateLimit(key, LOGIN_LIMIT, LOGIN_WINDOW_MS);
  if (!limit.ok) {
    return {
      ok: false,
      error: `Juda ko'p urinish. ${limit.retryAfterSeconds} soniyadan so'ng qayta urinib ko'ring.`,
    };
  }

  if (email) {
    const employee = await prisma.employee.findUnique({ where: { email } });
    if (!employee || !employee.isActive) {
      await writeAuditLog({
        actorLabel: `failed-login:${email}`,
        action: "auth.login_failed",
        entity: "Employee",
        entityId: email,
      });
      return { ok: false, error: "Email yoki parol noto'g'ri." };
    }
    const valid = await verifyPassword(password, employee.passwordHash);
    if (!valid) {
      await writeAuditLog({
        actorId: employee.id,
        actorLabel: employee.name,
        action: "auth.login_failed",
        entity: "Employee",
        entityId: employee.id,
      });
      return { ok: false, error: "Email yoki parol noto'g'ri." };
    }
    await createEmployeeSession(employee.id);
    await writeAuditLog({
      actorId: employee.id,
      actorLabel: employee.name,
      action: "auth.login",
      entity: "Employee",
      entityId: employee.id,
    });
    return { ok: true };
  }

  if (!verifyAdminPassword(password)) {
    await writeAuditLog({
      actorLabel: "failed-login:shared",
      action: "auth.login_failed",
      entity: "Admin",
      entityId: "shared",
    });
    return { ok: false, error: "Parol noto'g'ri." };
  }

  await createAdminSession();
  await writeAuditLog({
    actorLabel: "admin",
    action: "auth.login",
    entity: "Admin",
    entityId: "shared",
  });
  return { ok: true };
}
