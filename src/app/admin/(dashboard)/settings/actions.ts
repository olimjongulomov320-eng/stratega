"use server";

import { revalidatePath } from "next/cache";
import { getCurrentEmployee } from "@/lib/employee-auth";
import { requireAdminPermission } from "@/lib/require-permission";
import { setSetting, allSettingsSchema, SETTING_KEYS } from "@/lib/settings";
import { writeAuditLog } from "@/lib/audit";

export type SettingsActionResult =
  | { ok: true }
  | { ok: false; error: string };

const KNOWN_KEYS = new Set(allSettingsSchema().map((s) => s.key));
const INT_KEYS = new Set(
  allSettingsSchema().filter((s) => s.type === "int").map((s) => s.key)
);
const BOOL_KEYS = new Set(
  allSettingsSchema().filter((s) => s.type === "bool").map((s) => s.key)
);

export async function saveSettingsAction(
  values: Record<string, string>
): Promise<SettingsActionResult> {
  await requireAdminPermission("settings.manage");
  const employee = await getCurrentEmployee();

  const changed: Record<string, { from: string; to: string }> = {};
  try {
    for (const [key, rawValue] of Object.entries(values)) {
      if (!KNOWN_KEYS.has(key)) continue;
      let value = rawValue.trim();

      if (BOOL_KEYS.has(key)) {
        value = value === "true" || value === "on" || value === "1" ? "true" : "false";
      } else if (INT_KEYS.has(key)) {
        const n = Number(value);
        if (!Number.isInteger(n) || n < 0 || n > 1_000_000) {
          return { ok: false, error: `"${key}" uchun musbat butun son kiriting.` };
        }
        value = String(n);
      } else if (key === SETTING_KEYS.COMPANY_NAME && !value) {
        return { ok: false, error: "Kompaniya nomi bo'sh bo'lishi mumkin emas." };
      }

      // Faqat haqiqiy o'zgarishlarni yozamiz.
      const { prisma } = await import("@/lib/prisma");
      const existing = await prisma.setting.findUnique({ where: { key } });
      const before = existing?.value ?? null;
      await setSetting(key, value);
      if (before !== value) {
        changed[key] = { from: before ?? "(default)", to: value };
      }
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }

  if (Object.keys(changed).length > 0) {
    await writeAuditLog({
      actorId: employee?.id ?? null,
      action: "settings.update",
      entity: "Setting",
      entityId: "global",
      oldData: Object.fromEntries(
        Object.entries(changed).map(([k, v]) => [k, v.from])
      ),
      newData: Object.fromEntries(
        Object.entries(changed).map(([k, v]) => [k, v.to])
      ),
    });
  }

  revalidatePath("/admin/settings");
  return { ok: true };
}
