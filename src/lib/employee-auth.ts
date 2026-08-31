import { cookies } from "next/headers";
import { randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { prisma } from "@/lib/prisma";
import type { Employee, EmployeeRole } from "@/generated/prisma/client";
import { type Permission, roleHasPermission } from "@/lib/permissions";
import { EMPLOYEE_COOKIE } from "@/lib/employee-auth-cookie";

const scryptAsync = promisify(scrypt);
const SESSION_DAYS = 7;

// --- Parol xeshlash (Node ichki scrypt, qo'shimcha kutubxonasiz) ---

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  stored: string
): Promise<boolean> {
  const [salt, hashHex] = stored.split(":");
  if (!salt || !hashHex) return false;
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  const expected = Buffer.from(hashHex, "hex");
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}

// --- Sessiya (bazada saqlanadigan token, mijoz Session'iga o'xshash) ---

export async function createEmployeeSession(employeeId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await prisma.employeeSession.create({
    data: { token, employeeId, expiresAt },
  });

  const cookieStore = await cookies();
  cookieStore.set(EMPLOYEE_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function getCurrentEmployee(): Promise<Employee | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(EMPLOYEE_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.employeeSession.findUnique({
    where: { token },
    include: { employee: true },
  });

  if (!session || session.expiresAt < new Date()) return null;
  if (!session.employee.isActive) return null;

  return session.employee;
}

export async function clearEmployeeSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(EMPLOYEE_COOKIE)?.value;
  if (token) {
    await prisma.employeeSession.deleteMany({ where: { token } });
  }
  cookieStore.delete(EMPLOYEE_COOKIE);
}

// --- Ruxsat tekshiruvi ---

// Xodim joriy sessiyada ma'lum ruxsatga ega ekanligini tekshiradi.
// Muvaffaqiyatsiz bo'lsa Error tashlaydi — chaqiruvchi action shu yerda to'xtaydi.
export async function requirePermission(
  permission: Permission
): Promise<Employee> {
  const employee = await getCurrentEmployee();
  if (!employee) {
    throw new Error("Unauthorized");
  }
  if (!roleHasPermission(employee.role as EmployeeRole, permission)) {
    throw new Error(
      `Ruxsat yo'q: "${permission}" harakati uchun "${employee.role}" roli yetarli emas.`
    );
  }
  return employee;
}
