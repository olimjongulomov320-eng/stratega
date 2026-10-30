"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAction, audit, safe, str, optStr, int, bool, type ActionState } from "@/lib/admin";
import { slugify } from "@/lib/slug";

function read(form: FormData) {
  const name = str(form, "name");
  if (!name) throw new Error("Kategoriya nomini kiriting.");
  return {
    name,
    nameRu: optStr(form, "nameRu"),
    nameEn: optStr(form, "nameEn"),
    description: optStr(form, "description"),
    descriptionRu: optStr(form, "descriptionRu"),
    descriptionEn: optStr(form, "descriptionEn"),
    icon: optStr(form, "icon"),
    imageUrl: optStr(form, "imageUrl"),
    sortOrder: int(form, "sortOrder") ?? 0,
    isActive: bool(form, "isActive"),
    isSparePart: bool(form, "isSparePart"),
    olxCategory: optStr(form, "olxCategory"),
  };
}

export async function saveCategory(_: ActionState, form: FormData): Promise<ActionState> {
  const id = str(form, "id");
  const res = await safe(async () => {
    const session = await requireAction("products.write");
    const data = read(form);
    if (id) {
      const slug = slugify(str(form, "slug"));
      await prisma.category.update({ where: { id }, data: { ...data, ...(slug ? { slug } : {}) } });
      await audit(session, "Kategoriya tahrirlandi", "Category", id);
    } else {
      const slug = slugify(str(form, "slug") || data.name);
      const c = await prisma.category.create({ data: { ...data, slug } });
      await audit(session, "Kategoriya yaratildi", "Category", c.id);
    }
  });
  if (res?.error) return res;
  revalidatePath("/", "layout");
  if (id) return { ok: true, message: "Saqlandi." };
  redirect("/admin/categories");
}

export async function deleteCategory(_: ActionState, form: FormData): Promise<ActionState> {
  const res = await safe(async () => {
    const session = await requireAction("products.write");
    const id = str(form, "id");
    const count = await prisma.product.count({ where: { categoryId: id } });
    if (count > 0) throw new Error(`Kategoriyada ${count} ta mahsulot bor — avval ularni boshqa kategoriyaga o'tkazing.`);
    await prisma.category.delete({ where: { id } });
    await audit(session, "Kategoriya o'chirildi", "Category", id);
  });
  if (res?.error) return res;
  revalidatePath("/", "layout");
  redirect("/admin/categories");
}
