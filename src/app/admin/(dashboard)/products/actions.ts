"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { recordStockChange } from "@/lib/stock";

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
  sku: string | null;
  barcode: string | null;
  costPrice: number | null;
  minimumStock: number;
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

  await prisma.$transaction(async (tx) => {
    const created = await tx.product.create({
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
        sku: input.sku,
        barcode: input.barcode,
        costPrice: input.costPrice,
        minimumStock: input.minimumStock,
      },
    });

    if (input.stock !== 0) {
      await recordStockChange(tx, {
        productId: created.id,
        change: input.stock,
        reason: "MANUAL",
        note: "Boshlang'ich qoldiq",
      });
    }
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

  await prisma.$transaction(async (tx) => {
    const current = await tx.product.findUniqueOrThrow({
      where: { id: productId },
      select: { stock: true, price: true },
    });

    await tx.product.update({
      where: { id: productId },
      data: {
        name,
        description: input.description.trim(),
        price: input.price,
        oldPrice: input.oldPrice,
        imageUrl: input.imageUrl,
        categoryId: input.categoryId,
        isActive: input.isActive,
        isFeatured: input.isFeatured,
        sku: input.sku,
        barcode: input.barcode,
        costPrice: input.costPrice,
        minimumStock: input.minimumStock,
        // stock bu yerda o'zgartirilmaydi — quyidagi recordStockChange
        // Product.stock ustidan yagona yozuvchi hisoblanadi
      },
    });

    if (input.price !== current.price) {
      await tx.priceHistory.create({
        data: {
          productId,
          oldPrice: current.price,
          newPrice: input.price,
        },
      });
    }

    const delta = input.stock - current.stock;
    if (delta !== 0) {
      await recordStockChange(tx, {
        productId,
        change: delta,
        reason: "MANUAL",
      });
    }
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
