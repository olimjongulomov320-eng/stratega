import "server-only";
import { redirect } from "next/navigation";
import { getAdminSession, type AdminSession } from "@/lib/admin-auth";
import { can, type Permission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

/** For pages: redirect to login (or dashboard) when the user lacks access. */
export async function requirePage(permission?: Permission): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  if (permission && !can(session.role, permission)) redirect("/admin?denied=1");
  return session;
}

export class AccessError extends Error {}

/** For server actions: throw when the user lacks access. */
export async function requireAction(permission: Permission): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) throw new AccessError("Sessiya tugagan. Qayta kiring.");
  if (!can(session.role, permission)) throw new AccessError("Bu amal uchun ruxsat yo'q.");
  return session;
}

export async function audit(
  session: AdminSession,
  action: string,
  entityType?: string,
  entityId?: string,
  details?: Prisma.InputJsonValue
) {
  await prisma.auditLog.create({
    data: { action, actor: session.name, actorId: session.employeeId, entityType, entityId, details },
  });
}

/** Sequential document numbers: ORD-2026-0001. */
export async function nextNumber(prefix: string, tx: Prisma.TransactionClient | typeof prisma = prisma): Promise<string> {
  const year = new Date().getFullYear();
  const key = `${prefix}-${year}`;
  const counter = await tx.counter.upsert({
    where: { key },
    create: { key, value: 1 },
    update: { value: { increment: 1 } },
  });
  return `${key}-${String(counter.value).padStart(4, "0")}`;
}

export type { ActionState } from "@/lib/admin-types";
import type { ActionState } from "@/lib/admin-types";

/** Wrap an action body: converts thrown errors into a form state. */
export async function safe(fn: () => Promise<ActionState | void>): Promise<ActionState> {
  try {
    return (await fn()) ?? { ok: true };
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e && String((e as { digest: unknown }).digest).startsWith("NEXT_REDIRECT")) throw e;
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("Unique constraint")) return { error: "Bunday qiymat allaqachon mavjud (slug, SKU yoki kod takrorlanmasligi kerak)." };
    return { error: msg };
  }
}

export function str(form: FormData, key: string): string {
  const v = form.get(key);
  return typeof v === "string" ? v.trim() : "";
}
export function optStr(form: FormData, key: string): string | null {
  return str(form, key) || null;
}
export function int(form: FormData, key: string): number | null {
  const v = str(form, key).replace(/\s/g, "");
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : null;
}
export function num(form: FormData, key: string): number | null {
  const v = str(form, key).replace(/\s/g, "").replace(",", ".");
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
export function bool(form: FormData, key: string): boolean {
  return form.get(key) === "on" || form.get(key) === "true";
}
