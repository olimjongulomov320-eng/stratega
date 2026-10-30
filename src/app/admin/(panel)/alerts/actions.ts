"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAction, safe, str, type ActionState } from "@/lib/admin";
import { recalcAlerts } from "@/lib/alerts";

export async function recalc(): Promise<ActionState> {
  return safe(async () => {
    await requireAction("stock.read");
    const n = await recalcAlerts();
    revalidatePath("/admin/alerts");
    return { ok: true, message: `${n} ta faol ogohlantirish.` };
  });
}

export async function markRead(_: ActionState, form: FormData): Promise<ActionState> {
  return safe(async () => {
    await requireAction("stock.read");
    const id = str(form, "id");
    if (id === "all") await prisma.alert.updateMany({ where: { isRead: false }, data: { isRead: true } });
    else await prisma.alert.update({ where: { id }, data: { isRead: true } });
    revalidatePath("/admin/alerts");
  });
}
