"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/employee-auth";
import { writeAuditLog } from "@/lib/audit";
import { requireAdminPermission } from "@/lib/require-permission";
import type { EmployeeRole } from "@/generated/prisma/client";

export type EmployeeFormResult = { ok: true } | { ok: false; error: string };

export type EmployeeInput = {
  name: string;
  email: string;
  phone: string;
  role: EmployeeRole;
  isActive: boolean;
  password?: string; // faqat yaratishda yoki parolni almashtirishda
};

export async function createEmployee(
  input: EmployeeInput
): Promise<EmployeeFormResult> {
  await requireAdminPermission("users.manage");

  const name = input.name.trim();
  const email = input.email.trim();
  if (!name) return { ok: false, error: "Ismni kiriting." };
  if (!email) return { ok: false, error: "Emailni kiriting." };
  if (!input.password || input.password.length < 6) {
    return { ok: false, error: "Parol kamida 6 belgidan iborat bo'lishi kerak." };
  }

  const existing = await prisma.employee.findUnique({ where: { email } });
  if (existing) {
    return { ok: false, error: "Bu email bilan xodim allaqachon mavjud." };
  }

  const passwordHash = await hashPassword(input.password);

  const employee = await prisma.employee.create({
    data: {
      name,
      email,
      phone: input.phone.trim() || null,
      role: input.role,
      isActive: input.isActive,
      passwordHash,
    },
  });

  await writeAuditLog({
    action: "employee.create",
    entity: "Employee",
    entityId: employee.id,
    newData: { name, email, role: input.role },
  });

  revalidatePath("/admin/employees");
  redirect("/admin/employees");
}

export async function updateEmployee(
  employeeId: string,
  input: EmployeeInput
): Promise<EmployeeFormResult> {
  await requireAdminPermission("users.manage");

  const name = input.name.trim();
  if (!name) return { ok: false, error: "Ismni kiriting." };

  const data: {
    name: string;
    phone: string | null;
    role: EmployeeRole;
    isActive: boolean;
    passwordHash?: string;
  } = {
    name,
    phone: input.phone.trim() || null,
    role: input.role,
    isActive: input.isActive,
  };

  if (input.password && input.password.trim()) {
    if (input.password.length < 6) {
      return { ok: false, error: "Parol kamida 6 belgidan iborat bo'lishi kerak." };
    }
    data.passwordHash = await hashPassword(input.password);
  }

  await prisma.employee.update({ where: { id: employeeId }, data });

  await writeAuditLog({
    action: "employee.update",
    entity: "Employee",
    entityId: employeeId,
    newData: { name, role: input.role },
  });

  revalidatePath("/admin/employees");
  redirect("/admin/employees");
}
