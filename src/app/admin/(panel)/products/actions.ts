"use server";

import { revalidateStorefront } from "@/lib/storefront-cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAction, audit, safe, str, optStr, int, num, bool, type ActionState } from "@/lib/admin";
import { moveStock } from "@/lib/inventory";
import { getSetting } from "@/lib/settings";
import { Prisma, type Unit } from "@/generated/prisma/client";
import { parseSpecText } from "@/lib/product-specs";
import { slugify } from "@/lib/slug";
import { readTableFile } from "@/lib/table-file";
import { importProductRows } from "@/lib/product-import";

const UNITS: Unit[] = ["PIECE", "SET", "KG", "METER", "LITER", "PALLET", "BOX"];

function nonNeg(v: number | null): number | null {
  if (v === null) return null;
  if (v < 0) throw new Error("Texnik xususiyatlar manfiy bo'lishi mumkin emas.");
  return v;
}

/** Only https:// links or our own /uploads paths. */
function safeUrl(v: string | null): string | null {
  if (!v) return null;
  if (/^https:\/\/\S+$/i.test(v) || /^\/uploads\/\S+$/.test(v)) return v;
  throw new Error("Havola https:// yoki /uploads/ bilan boshlanishi kerak.");
}

function specsJson(text: string): Prisma.InputJsonValue | typeof Prisma.DbNull {
  const rows = parseSpecText(text);
  return rows.length ? (rows as unknown as Prisma.InputJsonValue) : Prisma.DbNull;
}

function readProduct(form: FormData) {
  const name = str(form, "name");
  const price = int(form, "price");
  const categoryId = str(form, "categoryId");
  if (!name) throw new Error("Mahsulot nomini kiriting.");
  if (price === null || price < 0) throw new Error("Narxni to'g'ri kiriting.");
  if (!categoryId) throw new Error("Kategoriyani tanlang.");
  const unit = str(form, "unit") as Unit;
  const images = str(form, "images")
    .split(/\n+/)
    .map((s) => s.trim())
    .filter((s) => s.startsWith("/") || s.startsWith("https://"));
  return {
    name,
    nameRu: optStr(form, "nameRu"),
    nameEn: optStr(form, "nameEn"),
    description: str(form, "description"),
    descriptionRu: optStr(form, "descriptionRu"),
    descriptionEn: optStr(form, "descriptionEn"),
    brand: optStr(form, "brand"),
    sku: optStr(form, "sku"),
    barcode: optStr(form, "barcode"),
    compatibleWith: optStr(form, "compatibleWith"),
    unit: UNITS.includes(unit) ? unit : "PIECE",
    price,
    oldPrice: int(form, "oldPrice"),
    costPrice: int(form, "costPrice"),
    imageUrl: optStr(form, "imageUrl"),
    images,
    warrantyMonths: int(form, "warrantyMonths"),
    freeDelivery: bool(form, "freeDelivery"),
    priceOnRequest: bool(form, "priceOnRequest"),
    minimumStock: int(form, "minimumStock") ?? 0,
    reorderPoint: int(form, "reorderPoint"),
    reorderQuantity: int(form, "reorderQuantity"),
    weightKg: num(form, "weightKg"),
    capacityKg: nonNeg(num(form, "capacityKg")),
    liftHeightMm: nonNeg(int(form, "liftHeightMm")),
    workingWidthMm: nonNeg(int(form, "workingWidthMm")),
    powerKw: nonNeg(num(form, "powerKw")),
    specs: specsJson(str(form, "specs")),
    datasheetUrl: safeUrl(optStr(form, "datasheetUrl")),
    videoUrl: safeUrl(optStr(form, "videoUrl")),
    leadTimeDays: nonNeg(int(form, "leadTimeDays")),
    isActive: bool(form, "isActive"),
    isFeatured: bool(form, "isFeatured"),
    isBestseller: bool(form, "isBestseller"),
    categoryId,
  };
}

export async function createProduct(_: ActionState, form: FormData): Promise<ActionState> {
  let id = "";
  const res = await safe(async () => {
    const session = await requireAction("products.write");
    const data = readProduct(form);
    const slug = slugify(str(form, "slug") || `${data.name}${data.sku ? "" : ""}`) || `mahsulot-${Date.now()}`;
    const created = await prisma.product.create({ data: { ...data, slug } });
    id = created.id;
    const opening = int(form, "openingStock") ?? 0;
    const warehouseId = str(form, "warehouseId");
    if (opening > 0 && warehouseId) {
      await prisma.$transaction((tx) =>
        moveStock(tx, { productId: created.id, warehouseId, delta: opening, reason: "OPENING", note: "Boshlang'ich qoldiq", actor: session.name })
      );
    }
    await audit(session, "Mahsulot yaratildi", "Product", created.id, { name: data.name, price: data.price });
  });
  // Before the error check: when only the opening stock fails, the product already exists.
  revalidateStorefront();
  if (res?.error) return res;
  redirect(`/admin/products/${id}/overview`);
}

export async function updateProduct(_: ActionState, form: FormData): Promise<ActionState> {
  return safe(async () => {
    const session = await requireAction("products.write");
    const id = str(form, "id");
    const before = await prisma.product.findUnique({ where: { id } });
    if (!before) throw new Error("Mahsulot topilmadi.");
    const data = readProduct(form);
    const slug = slugify(str(form, "slug")) || before.slug;
    await prisma.$transaction(async (tx) => {
      await tx.product.update({ where: { id }, data: { ...data, slug } });
      if (before.price !== data.price) {
        await tx.priceChange.create({ data: { productId: id, oldPrice: before.price, newPrice: data.price, actor: session.name } });
      }
    });
    await audit(session, "Mahsulot tahrirlandi", "Product", id, before.price !== data.price ? { oldPrice: before.price, newPrice: data.price } : undefined);
    revalidateStorefront();
    return { ok: true, message: "Saqlandi." };
  });
}

export async function setProductActive(_: ActionState, form: FormData): Promise<ActionState> {
  return safe(async () => {
    const session = await requireAction("products.write");
    const id = str(form, "id");
    const isActive = str(form, "active") === "1";
    await prisma.product.update({ where: { id }, data: { isActive } });
    await audit(session, isActive ? "Mahsulot faollashtirildi" : "Mahsulot yashirildi", "Product", id);
    revalidateStorefront();
  });
}

export async function deleteProduct(_: ActionState, form: FormData): Promise<ActionState> {
  const res = await safe(async () => {
    const session = await requireAction("products.write");
    const id = str(form, "id");
    const used = await prisma.product.findUnique({
      where: { id },
      select: { name: true, _count: { select: { orderLines: true, rfqItems: true, documentLines: true, quotationLines: true, shipmentLines: true } } },
    });
    if (!used) throw new Error("Mahsulot topilmadi.");
    const refs = Object.values(used._count).reduce((a, b) => a + b, 0);
    if (refs > 0) throw new Error("Mahsulot hujjatlarda ishlatilgan — o'chirib bo'lmaydi. Uni yashiring (Faol emas).");
    await prisma.product.delete({ where: { id } });
    await audit(session, "Mahsulot o'chirildi", "Product", id, { name: used.name });
  });
  if (res?.error) return res;
  revalidateStorefront();
  redirect("/admin/products");
}

export async function adjustStock(_: ActionState, form: FormData): Promise<ActionState> {
  return safe(async () => {
    const session = await requireAction("stock.write");
    const productId = str(form, "productId");
    const warehouseId = str(form, "warehouseId");
    const mode = str(form, "mode"); // "set" | "delta"
    const value = int(form, "value");
    const note = optStr(form, "note");
    if (!warehouseId || value === null) throw new Error("Ombor va miqdorni kiriting.");
    const allowNegative = await getSetting<boolean>("stock.allowNegative");
    await prisma.$transaction(async (tx) => {
      const level = await tx.stockLevel.findUnique({ where: { productId_warehouseId: { productId, warehouseId } } });
      const delta = mode === "set" ? value - (level?.quantity ?? 0) : value;
      if (delta === 0) return;
      await moveStock(tx, { productId, warehouseId, delta, reason: "ADJUSTMENT", note: note ?? "Qo'lda tuzatish", actor: session.name, allowNegative });
    });
    await audit(session, "Qoldiq tuzatildi", "Product", productId, { warehouseId, mode, value });
    revalidateStorefront();
    return { ok: true, message: "Qoldiq yangilandi." };
  });
}

/** Column aliases accepted in the CSV header (Uzbek / Russian / English). */
export async function importProductsCsv(_: ActionState, form: FormData): Promise<ActionState> {
  return safe(async () => {
    const session = await requireAction("products.write");
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) throw new Error("CSV yoki Excel (.xlsx) faylni tanlang.");
    if (file.size > 5 * 1024 * 1024) throw new Error("Fayl 5MB dan katta.");
    const usdRate = num(form, "usdRate");
    const createMissing = form.get("createMissing") !== null;

    const { created, updated, skipped, errors } = await importProductRows(await readTableFile(file), { usdRate, createMissing, actor: session.name });

    await audit(session, "CSV import (mahsulotlar)", "Product", undefined, { created, updated, skipped: skipped.slice(0, 50), errors: errors.slice(0, 50), usdRate });
    revalidateStorefront();
    const parts = [`${created} ta yangi mahsulot qo'shildi, ${updated} ta yangilandi.`];
    if (skipped.length) parts.push(`Topilmadi (o'tkazib yuborildi): ${skipped.slice(0, 10).join(", ")}${skipped.length > 10 ? "…" : ""}`);
    if (errors.length) parts.push(`Xatolar: ${errors.slice(0, 5).join("; ")}${errors.length > 5 ? ` va yana ${errors.length - 5} ta` : ""}`);
    return errors.length && !created && !updated ? { error: parts.join(" ") } : { ok: true, message: parts.join(" ") };
  });
}
