"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAction, audit, safe, str, optStr, int, num, bool, type ActionState } from "@/lib/admin";
import { readContactFile, normInn, nameKey } from "@/lib/contact-import";

export async function saveSupplier(_: ActionState, form: FormData): Promise<ActionState> {
  const id = str(form, "id");
  let savedId = id;
  const res = await safe(async () => {
    const session = await requireAction("suppliers.write");
    const name = str(form, "name");
    if (!name) throw new Error("Nomini kiriting.");
    const data = {
      name,
      legalName: optStr(form, "legalName"),
      inn: optStr(form, "inn"),
      contactName: optStr(form, "contactName"),
      phone: optStr(form, "phone"),
      email: optStr(form, "email"),
      address: optStr(form, "address"),
      country: optStr(form, "country"),
      note: optStr(form, "note"),
      isActive: bool(form, "isActive"),
    };
    if (id) await prisma.supplier.update({ where: { id }, data });
    else savedId = (await prisma.supplier.create({ data })).id;
    await audit(session, id ? "Yetkazib beruvchi tahrirlandi" : "Yetkazib beruvchi yaratildi", "Supplier", savedId, { name });
  });
  if (res?.error) return res;
  revalidatePath("/admin/suppliers");
  redirect(`/admin/suppliers/${savedId}`);
}

export async function linkProduct(_: ActionState, form: FormData): Promise<ActionState> {
  return safe(async () => {
    const session = await requireAction("suppliers.write");
    const supplierId = str(form, "supplierId");
    const productId = str(form, "productId");
    if (!productId) throw new Error("Mahsulotni tanlang.");
    const data = { supplierSku: optStr(form, "supplierSku"), priceUsd: num(form, "priceUsd"), leadTimeDays: int(form, "leadTimeDays") };
    await prisma.productSupplier.upsert({ where: { productId_supplierId: { productId, supplierId } }, create: { productId, supplierId, ...data }, update: data });
    await audit(session, "Mahsulot yetkazib beruvchiga bog'landi", "Supplier", supplierId, { productId });
    revalidatePath(`/admin/suppliers/${supplierId}`);
    return { ok: true, message: "Saqlandi." };
  });
}

export async function unlinkProduct(_: ActionState, form: FormData): Promise<ActionState> {
  return safe(async () => {
    await requireAction("suppliers.write");
    await prisma.productSupplier.delete({ where: { id: str(form, "id") } });
    revalidatePath("/admin/suppliers", "layout");
  });
}

const SUPPLIER_COLS = {
  name: ["nomi", "yetkazib_beruvchi", "название", "поставщик", "name", "supplier"],
  legalName: ["yuridik_nomi", "юридическое_название", "legal_name", "company"],
  inn: ["inn", "stir", "инн", "tin"],
  contactName: ["aloqa", "aloqa_shaxsi", "контакт", "контактное_лицо", "contact"],
  phone: ["telefon", "телефон", "phone"],
  email: ["email", "e-mail", "почта"],
  address: ["manzil", "адрес", "address"],
  country: ["mamlakat", "davlat", "страна", "country"],
  note: ["izoh", "примечание", "note"],
} as const;

/**
 * Suppliers from CSV/XLSX (header row required, columns in any order).
 * Existing suppliers are matched by INN, then by name, and updated in place.
 * Empty cells never overwrite existing data.
 */
export async function importSuppliers(_: ActionState, form: FormData): Promise<ActionState> {
  return safe(async () => {
    const session = await requireAction("suppliers.write");
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) throw new Error("CSV yoki Excel faylni tanlang.");
    if (file.size > 5 * 1024 * 1024) throw new Error("Fayl 5 MB dan oshmasin.");
    const { rows, missing } = await readContactFile(file, SUPPLIER_COLS, "name", 2000);
    if (missing) throw new Error(`Sarlavhada «${missing}» ustuni topilmadi.`);
    const existing = await prisma.supplier.findMany({ select: { id: true, name: true, inn: true } });
    const byInn = new Map(existing.filter((x) => normInn(x.inn)).map((x) => [normInn(x.inn)!, x.id]));
    const byName = new Map(existing.map((x) => [nameKey(x.name), x.id]));
    let created = 0;
    let updated = 0;
    for (const r of rows) {
      const data = {
        name: r.name!,
        legalName: r.legalName,
        inn: normInn(r.inn) ?? undefined,
        contactName: r.contactName,
        phone: r.phone,
        email: r.email,
        address: r.address,
        country: r.country,
        note: r.note,
      };
      const id = (data.inn && byInn.get(data.inn)) || byName.get(nameKey(data.name));
      if (id) {
        await prisma.supplier.update({ where: { id }, data });
        updated++;
      } else {
        const x = await prisma.supplier.create({ data });
        byName.set(nameKey(x.name), x.id);
        if (data.inn) byInn.set(data.inn, x.id);
        created++;
      }
    }
    await audit(session, "Import (yetkazib beruvchilar)", "Supplier", undefined, { created, updated });
    revalidatePath("/admin/suppliers");
    return { ok: true, message: `${created} ta yangi yetkazib beruvchi qo'shildi, ${updated} ta yangilandi.` };
  });
}
