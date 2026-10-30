"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAction, audit, safe, str, optStr, bool, type ActionState } from "@/lib/admin";

export async function savePriceList(_: ActionState, form: FormData): Promise<ActionState> {
  const id = str(form, "id");
  let savedId = id;
  const res = await safe(async () => {
    const session = await requireAction("finance.write");
    const name = str(form, "name");
    const code = str(form, "code").toUpperCase().replace(/[^A-Z0-9_-]/g, "");
    if (!name || !code) throw new Error("Nomi va kodini kiriting.");
    const data = { name, code, note: optStr(form, "note"), isActive: bool(form, "isActive") };
    if (id) await prisma.priceList.update({ where: { id }, data });
    else savedId = (await prisma.priceList.create({ data })).id;
    await audit(session, id ? "Narx ro'yxati tahrirlandi" : "Narx ro'yxati yaratildi", "PriceList", savedId);
  });
  if (res?.error) return res;
  redirect(`/admin/price-lists/${savedId}`);
}

export async function savePrices(_: ActionState, form: FormData): Promise<ActionState> {
  return safe(async () => {
    const session = await requireAction("finance.write");
    const priceListId = str(form, "priceListId");
    let changed = 0;
    for (const [key, value] of form.entries()) {
      if (!key.startsWith("p_") || typeof value !== "string") continue;
      const productId = key.slice(2);
      const v = value.replace(/\s/g, "");
      if (!v) {
        const del = await prisma.priceListItem.deleteMany({ where: { priceListId, productId } });
        changed += del.count;
        continue;
      }
      const price = Math.round(Number(v));
      if (!Number.isFinite(price) || price < 0) continue;
      await prisma.priceListItem.upsert({ where: { priceListId_productId: { priceListId, productId } }, create: { priceListId, productId, price }, update: { price } });
      changed++;
    }
    await audit(session, "Narx ro'yxati narxlari saqlandi", "PriceList", priceListId, { changed });
    revalidatePath(`/admin/price-lists/${priceListId}`);
    return { ok: true, message: "Narxlar saqlandi." };
  });
}
