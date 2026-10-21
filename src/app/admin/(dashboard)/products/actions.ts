"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { recordStockChange } from "@/lib/stock";
import { requireAdminPermission } from "@/lib/require-permission";
import { writeAuditLog } from "@/lib/audit";
import { getCurrentEmployee } from "@/lib/employee-auth";

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
  unit?: string; // PIECE | SET | KG | METER | LITER | PALLET | BOX
  reorderPoint?: number | null;
  reorderQuantity?: number | null;
  weightKg?: number | null;
};

const ALLOWED_UNITS = ["PIECE", "SET", "KG", "METER", "LITER", "PALLET", "BOX"] as const;

export async function createProduct(
  input: ProductInput
): Promise<ProductFormResult> {
  await requireAdminPermission("products.write");
  const employee = await getCurrentEmployee();

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
        unit: (ALLOWED_UNITS as readonly string[]).includes(input.unit ?? "")
          ? (input.unit as (typeof ALLOWED_UNITS)[number])
          : "PIECE",
        reorderPoint: input.reorderPoint ?? null,
        reorderQuantity: input.reorderQuantity ?? null,
        weightKg: input.weightKg ?? null,
      },
    });

    if (input.stock !== 0) {
      await recordStockChange(tx, {
        productId: created.id,
        change: input.stock,
        reason: "MANUAL",
        note: "Boshlang'ich qoldiq",
        createdBy: employee?.id ?? null,
      });
    }

    await writeAuditLog(
      {
        actorId: employee?.id ?? null,
        actorLabel: employee ? null : "admin",
        action: "product.create",
        entity: "Product",
        entityId: created.id,
        newData: { name, price: input.price, sku: input.sku },
      },
      tx
    );
  });

  revalidatePath("/admin/products");
  revalidatePath("/");
  redirect("/admin/products");
}

export async function updateProduct(
  productId: string,
  input: ProductInput
): Promise<ProductFormResult> {
  await requireAdminPermission("products.write");
  const employee = await getCurrentEmployee();

  const name = input.name.trim();
  if (!name) return { ok: false, error: "Mahsulot nomini kiriting." };
  if (!input.categoryId) return { ok: false, error: "Kategoriyani tanlang." };
  if (input.price <= 0) return { ok: false, error: "Narx noto'g'ri." };

  await prisma.$transaction(async (tx) => {
    const current = await tx.product.findUniqueOrThrow({
      where: { id: productId },
      select: { stock: true, price: true, name: true, costPrice: true, isActive: true },
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
        unit: (ALLOWED_UNITS as readonly string[]).includes(input.unit ?? "")
          ? (input.unit as (typeof ALLOWED_UNITS)[number])
          : "PIECE",
        reorderPoint: input.reorderPoint ?? null,
        reorderQuantity: input.reorderQuantity ?? null,
        weightKg: input.weightKg ?? null,
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
          changedBy: employee?.id ?? "admin",
          reason: "Mahsulot tahriri orqali o'zgartirildi",
        },
      });
    }

    const delta = input.stock - current.stock;
    if (delta !== 0) {
      await recordStockChange(tx, {
        productId,
        change: delta,
        reason: "MANUAL",
        createdBy: employee?.id ?? null,
      });
    }

    await writeAuditLog(
      {
        actorId: employee?.id ?? null,
        actorLabel: employee ? null : "admin",
        action: "product.update",
        entity: "Product",
        entityId: productId,
        oldData: { name: current.name, price: current.price, costPrice: current.costPrice, isActive: current.isActive },
        newData: { name, price: input.price, costPrice: input.costPrice, isActive: input.isActive },
      },
      tx
    );
  });

  revalidatePath("/admin/products");
  revalidatePath("/");
  redirect("/admin/products");
}

// Mahsulotni o'chirish. Tarixi bor mahsulotlar (ombor harakatlari, buyurtma
// qatorlari) o'chirilmaydi — faqat nofaollashtiriladi, chunki ombor jurnali
// (StockMove) muhim audit ma'lumoti hisoblanadi va yo'qolishi mumkin emas.
export async function deleteProduct(productId: string): Promise<ProductFormResult> {
  await requireAdminPermission("products.write");
  const employee = await getCurrentEmployee();

  const hasHistory = await prisma.stockMove.findFirst({
    where: { productId },
    select: { id: true },
  });
  const hasOrderItems = await prisma.orderItem.findFirst({
    where: { productId },
    select: { id: true },
  });

  if (hasHistory || hasOrderItems) {
    // Faqat nofaollashtiramiz — tarix saqlanadi.
    await prisma.product.update({
      where: { id: productId },
      data: { isActive: false },
    });
    await writeAuditLog({
      actorId: employee?.id ?? null,
      actorLabel: employee ? null : "admin",
      action: "product.deactivate",
      entity: "Product",
      entityId: productId,
      newData: { reason: "history-exists" },
    });
    revalidatePath("/admin/products");
    return { ok: true };
  }

  await prisma.$transaction(async (tx) => {
    // Tarixiy bog'lanishlar (so'rov/taklif qatorlari) o'chiriladi — lekin
    // ombor jurnali va buyurtma qatorlari saqlanadi (yukorida tekshirildi).
    await tx.rfqItem.deleteMany({ where: { productId } });
    await tx.quotationItem.deleteMany({ where: { productId } });
    await tx.product.delete({ where: { id: productId } });
    await writeAuditLog(
      {
        actorId: employee?.id ?? null,
        actorLabel: employee ? null : "admin",
        action: "product.delete",
        entity: "Product",
        entityId: productId,
      },
      tx
    );
  });

  revalidatePath("/admin/products");
  revalidatePath("/");
  return { ok: true };
}
