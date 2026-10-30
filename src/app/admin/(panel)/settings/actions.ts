"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAction, audit, safe, type ActionState } from "@/lib/admin";
import { SETTING_DEFS } from "@/lib/settings";

export async function saveSettings(_: ActionState, form: FormData): Promise<ActionState> {
  return safe(async () => {
    const session = await requireAction("settings.manage");
    for (const def of SETTING_DEFS) {
      let value: string | number | boolean;
      if (def.type === "boolean") value = form.get(def.key) === "on";
      else if (def.type === "number") {
        const n = Number(String(form.get(def.key) ?? "").replace(",", "."));
        if (!Number.isFinite(n) || n < 0) throw new Error(`Noto'g'ri qiymat: ${def.label}`);
        value = n;
      } else value = String(form.get(def.key) ?? "").trim();
      await prisma.setting.upsert({ where: { key: def.key }, create: { key: def.key, value }, update: { value } });
    }
    await audit(session, "Sozlamalar saqlandi", "Setting");
    revalidatePath("/admin", "layout");
    return { ok: true, message: "Saqlandi." };
  });
}
