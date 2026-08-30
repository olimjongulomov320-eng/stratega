"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export type ProductFormResult = { ok: true } | { ok: false; error: string };

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export type ProductInput = {
  name: string;
  description: string;
  price: number;
  oldPrice: number | null;
  imageUrl: string | null;
  categoryId: string;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
};

async function requireAdmin() {
  if (!(await isAdminAuthenticated())) {
    throw new Error("Unauthorized");
  }
}

export async function createProduct(
  input: ProductInput
): Promise<ProductFormResult> {
  await requireAdmin();

  const name = input.name.trim();
  if (!name) return { ok: false, error: "Mahsulot nomini kiriting." };
  if (!input.categoryId) return { ok: false, error: "Kategoriyani tanlang." };
  if (input.price <= 0) return { ok: false, error: "Narx noto'g'ri." };

  let slug = slugify(name);
  const existing = await prisma.product.findUnique({ where: { slug } });
  if (existing) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  await prisma.product.create({
    data: {
      slug,
      name,
      description: input.description.trim(),
      price: input.price,
      oldPrice: input.oldPrice,
      imageUrl: input.imageUrl,
      categoryId: input.categoryId,
      stock: input.stock,
      isActive: input.isActive,
      isFeatured: input.isFeatured,
    },
  });

  revalidatePath("/admin/products");
  revalidatePath("/");
  redirect("/admin/products");
}

export async function updateProduct(
  productId: string,
  input: ProductInput
): Promise<ProductFormResult> {
  await requireAdmin();

  const name = input.name.trim();
  if (!name) return { ok: false, error: "Mahsulot nomini kiriting." };
  if (!input.categoryId) return { ok: false, error: "Kategoriyani tanlang." };
  if (input.price <= 0) return { ok: false, error: "Narx noto'g'ri." };

  const existing = await prisma.product.findUnique({
    where: { id: productId },
    select: { moySkladId: true, name: true, price: true, stock: true, imageUrl: true },
  });
  if (!existing) return { ok: false, error: "Mahsulot topilmadi." };

  const isMoySkladSynced = existing.moySkladId !== null;

  await prisma.product.update({
    where: { id: productId },
    data: {
      // MoySklad bilan sinxronlangan mahsulotlarda nomi, narxi, ombordagi
      // soni va rasmi faqat sinxronizatsiya orqali yangilanadi — disabled
      // formani chetlab o'tishga urinishlardan himoya.
      name: isMoySkladSynced ? existing.name : name,
      description: input.description.trim(),
      price: isMoySkladSynced ? existing.price : input.price,
      oldPrice: input.oldPrice,
      imageUrl: isMoySkladSynced ? existing.imageUrl : input.imageUrl,
      categoryId: input.categoryId,
      stock: isMoySkladSynced ? existing.stock : input.stock,
      isActive: input.isActive,
      isFeatured: input.isFeatured,
    },
  });

  revalidatePath("/admin/products");
  revalidatePath("/");
  redirect("/admin/products");
}

export async function deleteProduct(productId: string): Promise<ProductFormResult> {
  await requireAdmin();

  await prisma.rfqItem.deleteMany({ where: { productId } });
  await prisma.product.delete({ where: { id: productId } });

  revalidatePath("/admin/products");
  revalidatePath("/");
  return { ok: true };
}
