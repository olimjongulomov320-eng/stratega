"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/require-permission";
import { writeAuditLog, actorContext } from "@/lib/audit";

export type CategoryFormResult = { ok: true } | { ok: false; error: string };

export type CategoryInput = {
  name: string;
  icon: string;
  imageUrl: string | null;
  sortOrder: number;
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function createCategory(
  input: CategoryInput
): Promise<CategoryFormResult> {
  await requireAdminPermission("products.write");
  const actor = await actorContext();

  const name = input.name.trim();
  if (!name) return { ok: false, error: "Kategoriya nomini kiriting." };

  let slug = slugify(name);
  const existing = await prisma.category.findUnique({ where: { slug } });
  if (existing) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  const category = await prisma.category.create({
    data: {
      slug,
      name,
      icon: input.icon.trim() || null,
      imageUrl: input.imageUrl,
      sortOrder: input.sortOrder,
    },
  });

  await writeAuditLog({
    ...actor,
    action: "category.create",
    entity: "Category",
    entityId: category.id,
    newData: { name },
  });

  revalidatePath("/admin/categories");
  revalidatePath("/");
  redirect("/admin/categories");
}

export async function updateCategory(
  categoryId: string,
  input: CategoryInput
): Promise<CategoryFormResult> {
  await requireAdminPermission("products.write");
  const actor = await actorContext();

  const name = input.name.trim();
  if (!name) return { ok: false, error: "Kategoriya nomini kiriting." };

  const current = await prisma.category.findUnique({ where: { id: categoryId } });

  await prisma.category.update({
    where: { id: categoryId },
    data: {
      name,
      icon: input.icon.trim() || null,
      imageUrl: input.imageUrl,
      sortOrder: input.sortOrder,
    },
  });

  await writeAuditLog({
    ...actor,
    action: "category.update",
    entity: "Category",
    entityId: categoryId,
    oldData: { name: current?.name },
    newData: { name },
  });

  revalidatePath("/admin/categories");
  revalidatePath("/");
  redirect("/admin/categories");
}

export async function deleteCategory(
  categoryId: string
): Promise<CategoryFormResult> {
  await requireAdminPermission("products.write");
  const actor = await actorContext();

  const productCount = await prisma.product.count({
    where: { categoryId },
  });
  if (productCount > 0) {
    return {
      ok: false,
      error: `Bu kategoriyada ${productCount} ta mahsulot bor. Avval mahsulotlarni boshqa kategoriyaga o'tkazing yoki o'chiring.`,
    };
  }

  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  await prisma.category.delete({ where: { id: categoryId } });

  await writeAuditLog({
    ...actor,
    action: "category.delete",
    entity: "Category",
    entityId: categoryId,
    oldData: { name: category?.name },
  });

  revalidatePath("/admin/categories");
  revalidatePath("/");
  return { ok: true };
}
