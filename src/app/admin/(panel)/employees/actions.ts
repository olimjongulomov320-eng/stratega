"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAction, audit, safe, str, optStr, bool, type ActionState } from "@/lib/admin";
import { hashPassword } from "@/lib/password";
import type { Role } from "@/generated/prisma/client";

const ROLES: Role[] = ["OWNER", "ADMIN", "MANAGER", "WAREHOUSE", "ACCOUNTANT", "VIEWER"];

/** Telegram user IDs are whole numbers; empty = not linked. */
function telegramIdOf(form: FormData): string | null {
  const v = optStr(form, "telegramId");
  if (!v) return null;
  if (!/^\d{5,15}$/.test(v)) throw new Error("Telegram ID faqat raqamlardan iborat bo'lishi kerak (botda /id buyrug'i ko'rsatadi).");
  return v;
}

export async function saveEmployee(_: ActionState, form: FormData): Promise<ActionState> {
  const id = str(form, "id");
  const res = await safe(async () => {
    const session = await requireAction("users.manage");
    const name = str(form, "name");
    const email = str(form, "email").toLowerCase();
    const role = str(form, "role") as Role;
    const password = str(form, "password");
    if (!name || !email) throw new Error("Ism va emailni kiriting.");
    if (!ROLES.includes(role)) throw new Error("Rolni tanlang.");
    if (password && password.length < 10) throw new Error("Parol kamida 10 belgidan iborat bo'lsin.");
    const isActive = bool(form, "isActive");
    if (id) {
      if (id === session.employeeId && (!isActive || role !== "OWNER") && session.role === "OWNER") {
        const owners = await prisma.employee.count({ where: { role: "OWNER", isActive: true, id: { not: id } } });
        if (owners === 0) throw new Error("Oxirgi faol egani o'chirib yoki rolini tushirib bo'lmaydi.");
      }
      await prisma.employee.update({
        where: { id },
        data: { name, email, role, phone: optStr(form, "phone"), telegramId: telegramIdOf(form), isActive, ...(password ? { passwordHash: hashPassword(password) } : {}) },
      });
    } else {
      if (!password) throw new Error("Yangi xodim uchun parol kiriting.");
      await prisma.employee.create({ data: { name, email, role, phone: optStr(form, "phone"), telegramId: telegramIdOf(form), isActive, passwordHash: hashPassword(password) } });
    }
    await audit(session, id ? "Xodim tahrirlandi" : "Xodim yaratildi", "Employee", id || undefined, { email, role });
  });
  if (res?.error) return res;
  revalidatePath("/admin/employees");
  redirect("/admin/employees");
}
