import { prisma } from "@/lib/prisma";
import { createAdminSession } from "@/lib/admin-auth";
import { verifyWebAppInitData } from "@/lib/telegram-webapp";
import { adminToken } from "@/lib/telegram-api";
import { rateLimit, getRequestIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

/** Admin Mini App login: a verified Telegram user linked to an active employee gets the normal admin session. */
export async function POST(req: Request) {
  if (!rateLimit(`tg-admin-login:${getRequestIp(req)}`, 20, 15 * 60 * 1000)) {
    return Response.json({ error: "Juda ko'p urinish. Birozdan so'ng qayta urinib ko'ring." }, { status: 429 });
  }
  let initData = "";
  try {
    initData = String(((await req.json()) as { initData?: unknown }).initData ?? "");
  } catch {
    return Response.json({ error: "Noto'g'ri so'rov." }, { status: 400 });
  }
  const user = verifyWebAppInitData(initData) ?? verifyWebAppInitData(initData, adminToken());
  if (!user) return Response.json({ error: "Telegram tasdig'i noto'g'ri. Admin panelni botdagi tugma orqali oching." }, { status: 401 });

  const employee = await prisma.employee.findUnique({ where: { telegramId: String(user.id) } });
  if (!employee || !employee.isActive) {
    return Response.json({ error: `Sizning Telegram ID (${user.id}) hech bir faol xodimga ulanmagan. Admin → Xodimlar bo'limida qo'shing.` }, { status: 403 });
  }
  await prisma.employee.update({ where: { id: employee.id }, data: { lastLoginAt: new Date() } });
  await prisma.auditLog.create({ data: { action: "auth.login.telegram", actor: employee.name, actorId: employee.id, entityType: "Employee", entityId: employee.id } });
  await createAdminSession({ employeeId: employee.id, name: employee.name, role: employee.role }, { embedded: true });
  return Response.json({ ok: true });
}
