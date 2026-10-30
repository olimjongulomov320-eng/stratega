"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAction, audit, safe, str, optStr, int, bool, type ActionState } from "@/lib/admin";
import { readContactFile, normInn, nameKey } from "@/lib/contact-import";

export async function saveCustomer(_: ActionState, form: FormData): Promise<ActionState> {
  const id = str(form, "id");
  let savedId = id;
  const res = await safe(async () => {
    const session = await requireAction("customers.write");
    const companyName = str(form, "companyName");
    if (!companyName) throw new Error("Kompaniya nomini kiriting.");
    const data = {
      companyName,
      contactName: optStr(form, "contactName"),
      phone: optStr(form, "phone"),
      email: optStr(form, "email"),
      inn: optStr(form, "inn"),
      address: optStr(form, "address"),
      priceListId: optStr(form, "priceListId"),
      creditLimit: int(form, "creditLimit"),
      note: optStr(form, "note"),
      isActive: bool(form, "isActive"),
    };
    if (id) await prisma.customer.update({ where: { id }, data });
    else savedId = (await prisma.customer.create({ data })).id;
    await audit(session, id ? "Mijoz tahrirlandi" : "Mijoz yaratildi", "Customer", savedId, { companyName });
  });
  if (res?.error) return res;
  revalidatePath("/admin/customers");
  const back = str(form, "returnTo");
  redirect(back && back.startsWith("/admin") ? back : `/admin/customers/${savedId}`);
}

const CUSTOMER_COLS = {
  companyName: ["kompaniya", "nomi", "mijoz", "компания", "название", "company", "name"],
  contactName: ["aloqa", "aloqa_shaxsi", "контакт", "контактное_лицо", "contact"],
  phone: ["telefon", "телефон", "phone"],
  email: ["email", "e-mail", "почта"],
  inn: ["inn", "stir", "инн", "tin"],
  address: ["manzil", "адрес", "address"],
  creditLimit: ["kredit_limiti", "kredit", "кредитный_лимит", "credit_limit"],
  note: ["izoh", "примечание", "note"],
} as const;

/**
 * Customers from CSV/XLSX (header row required, columns in any order).
 * Existing customers are matched by INN, then by company name — and updated
 * instead of duplicated. Empty cells never overwrite existing data.
 */
export async function importCustomers(_: ActionState, form: FormData): Promise<ActionState> {
  return safe(async () => {
    const session = await requireAction("customers.write");
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) throw new Error("CSV yoki Excel faylni tanlang.");
    if (file.size > 5 * 1024 * 1024) throw new Error("Fayl 5 MB dan oshmasin.");
    const { rows, missing } = await readContactFile(file, CUSTOMER_COLS, "companyName", 2000);
    if (missing) throw new Error(`Sarlavhada «${missing}» ustuni topilmadi.`);
    const existing = await prisma.customer.findMany({ select: { id: true, companyName: true, inn: true } });
    const byInn = new Map(existing.filter((c) => normInn(c.inn)).map((c) => [normInn(c.inn)!, c.id]));
    const byName = new Map(existing.map((c) => [nameKey(c.companyName), c.id]));
    let created = 0;
    let updated = 0;
    for (const r of rows) {
      const credit = r.creditLimit ? Math.round(Number(r.creditLimit.replace(/[\s,]/g, ""))) : NaN;
      const data = {
        companyName: r.companyName!,
        contactName: r.contactName,
        phone: r.phone,
        email: r.email,
        inn: normInn(r.inn) ?? undefined,
        address: r.address,
        creditLimit: Number.isFinite(credit) ? credit : undefined,
        note: r.note,
      };
      const id = (data.inn && byInn.get(data.inn)) || byName.get(nameKey(data.companyName));
      if (id) {
        await prisma.customer.update({ where: { id }, data });
        updated++;
      } else {
        const c = await prisma.customer.create({ data });
        byName.set(nameKey(c.companyName), c.id);
        if (data.inn) byInn.set(data.inn, c.id);
        created++;
      }
    }
    await audit(session, "Import (mijozlar)", "Customer", undefined, { created, updated });
    revalidatePath("/admin/customers");
    return { ok: true, message: `${created} ta yangi mijoz qo'shildi, ${updated} ta yangilandi.` };
  });
}
