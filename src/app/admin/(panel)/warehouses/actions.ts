"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAction, audit, safe, str, optStr, bool, type ActionState } from "@/lib/admin";

export async function saveWarehouse(_: ActionState, form: FormData): Promise<ActionState> {
  const id = str(form, "id");
  const res = await safe(async () => {
    const session = await requireAction("stock.write");
    const name = str(form, "name");
    const code = str(form, "code").toUpperCase().replace(/[^A-Z0-9_-]/g, "");
    if (!name || !code) throw new Error("Nomi va kodini kiriting.");
    const data = { name, code, address: optStr(form, "address"), note: optStr(form, "note"), isActive: bool(form, "isActive"), isDefault: bool(form, "isDefault") };
    await prisma.$transaction(async (tx) => {
      if (data.isDefault) await tx.warehouse.updateMany({ data: { isDefault: false } });
      if (id) await tx.warehouse.update({ where: { id }, data });
      else await tx.warehouse.create({ data });
    });
    await audit(session, id ? "Ombor tahrirlandi" : "Ombor yaratildi", "Warehouse", id || undefined, { name });
  });
  if (res?.error) return res;
  revalidatePath("/admin/warehouses");
  redirect("/admin/warehouses");
}
