import "server-only";
import { prisma } from "@/lib/prisma";
import { moveStock } from "@/lib/inventory";
import type { Unit } from "@/generated/prisma/client";
import { slugify } from "@/lib/slug";
import { parseNumber } from "@/lib/csv";

const UNITS: Unit[] = ["PIECE", "SET", "KG", "METER", "LITER", "PALLET", "BOX"];

export const COLS = {
  sku: ["sku", "artikul", "артикул", "kod", "код"],
  slug: ["slug"],
  name: ["nomi_uz", "nomi", "name", "name_uz", "название_uz"],
  nameRu: ["nomi_ru", "name_ru", "название", "название_ru"],
  nameEn: ["nomi_en", "name_en"],
  category: ["kategoriya", "kategoriya_slug", "category", "категория"],
  categoryUz: ["kategoriya_uz", "category_uz"],
  categoryRu: ["kategoriya_ru", "category_ru"],
  brand: ["brend", "brand", "бренд"],
  unit: ["birlik", "unit", "ед"],
  costUsd: ["tannarx_usd", "cost_usd", "закупка_usd", "xarid_narxi_usd"],
  cost: ["tannarx", "cost", "себестоимость"],
  price: ["narx", "price", "цена", "sotuv_narxi"],
  oldPrice: ["eski_narx", "old_price"],
  stock: ["qoldiq", "ombordagi_soni", "stock", "остаток"],
  image: ["rasm", "image", "image_url", "фото"],
  supplier: ["yetkazib_beruvchi", "supplier", "поставщик"],
  supplierSku: ["yetkazib_beruvchi_kodi", "supplier_sku", "код_поставщика"],
  description: ["tavsif_uz", "tavsif", "description"],
  descriptionRu: ["tavsif_ru", "description_ru", "описание"],
  active: ["faol", "active", "активен"],
  compatibleWith: ["mos_keladi", "mos_keladigan_modellar", "совместимость", "подходит_для", "compatible_with"],
  sparePart: ["ehtiyot_qism", "запчасть", "spare_part"],
  capacityKg: ["yuk_kg", "kotarish_quvvati_kg", "грузоподъемность_кг", "capacity_kg"],
  liftHeightMm: ["kotarish_mm", "kotarish_balandligi_mm", "высота_подъема_мм", "lift_height_mm"],
  workingWidthMm: ["ish_kengligi_mm", "ширина_мм", "working_width_mm"],
  powerKw: ["quvvat_kvt", "мощность_квт", "power_kw"],
  datasheetUrl: ["pasport_pdf", "datasheet", "паспорт"],
  videoUrl: ["video", "video_url", "видео"],
  leadTimeDays: ["yetkazish_kun", "срок_поставки_дней", "lead_time_days"],
  priceOnRequest: ["narx_sorov", "narx_so'rov", "цена_по_запросу", "price_on_request"],
} as const;

export const UNIT_ALIASES: Record<string, Unit> = {
  dona: "PIECE", шт: "PIECE", piece: "PIECE", pcs: "PIECE",
  komplekt: "SET", компл: "SET", set: "SET", "to'plam": "SET",
  kg: "KG", кг: "KG", metr: "METER", м: "METER", m: "METER", litr: "LITER", л: "LITER",
  paddon: "PALLET", pallet: "PALLET", quti: "BOX", box: "BOX", коробка: "BOX",
};

/**
 * CSV import. Finds products by `sku` (or `slug`):
 *  - existing product → updates only the columns that are filled in;
 *  - new SKU with a name → creates the product (and its category if needed).
 * A product without a selling price is created hidden (inactive) until a price is set.
 * A real selling price switches "price on request" off unless the narx_sorov column says otherwise.
 * Used by the admin import page and by scripts/import-products.ts.
 */
export async function importProductRows(
  table: string[][],
  opts: { usdRate: number | null; createMissing: boolean; actor: string }
): Promise<{ created: number; updated: number; skipped: string[]; errors: string[] }> {
  const { usdRate, createMissing } = opts;
  const session = { name: opts.actor };
  const rows = table.slice(1);
  const header = (table[0] ?? []).map((h) => h.toLowerCase().replace(/\s+/g, "_"));
  const col = (k: keyof typeof COLS) => header.findIndex((h) => (COLS[k] as readonly string[]).includes(h));
  const idx = Object.fromEntries((Object.keys(COLS) as (keyof typeof COLS)[]).map((k) => [k, col(k)])) as Record<keyof typeof COLS, number>;
  if (idx.sku < 0 && idx.slug < 0) throw new Error("Birinchi qatorda 'sku' (yoki 'slug') ustuni bo'lishi kerak.");
  if (idx.costUsd >= 0 && rows.some((r) => r[idx.costUsd]) && !usdRate) throw new Error("Faylda tannarx_usd bor — USD kursini kiriting.");


  const warehouse = (await prisma.warehouse.findFirst({ where: { isDefault: true } })) ?? (await prisma.warehouse.findFirst());
  const get = (r: string[], k: keyof typeof COLS) => (idx[k] >= 0 ? (r[idx[k]] ?? "").trim() : "");
  const n = (r: string[], k: keyof typeof COLS) => parseNumber(get(r, k));
  // Spec columns: only filled, non-negative numbers / https links are written.
  const specCols = (r: string[]) => {
    const out: Record<string, number | string> = {};
    const capacity = n(r, "capacityKg");
    if (capacity !== null && capacity >= 0) out.capacityKg = capacity;
    const power = parseNumber(get(r, "powerKw"), { groups: false });
    if (power !== null && power >= 0) out.powerKw = power;
    for (const k of ["liftHeightMm", "workingWidthMm", "leadTimeDays"] as const) {
      const v = n(r, k);
      if (v !== null && v >= 0) out[k] = Math.round(v);
    }
    for (const k of ["datasheetUrl", "videoUrl"] as const) {
      const v = get(r, k);
      if (/^https:\/\/\S+$/i.test(v)) out[k] = v;
    }
    return out;
  };

  let created = 0;
  let updated = 0;
  const skipped: string[] = [];
  const errors: string[] = [];
  const categoryCache = new Map<string, string>();
  const supplierCache = new Map<string, string>();

  async function categoryId(r: string[]): Promise<string | null> {
    const slug = slugify(get(r, "category"));
    if (!slug) return null;
    if (categoryCache.has(slug)) return categoryCache.get(slug)!;
    let cat = await prisma.category.findUnique({ where: { slug } });
    if (!cat) {
      const nameUz = get(r, "categoryUz") || get(r, "category");
      const max = await prisma.category.aggregate({ _max: { sortOrder: true } });
      cat = await prisma.category.create({
        data: {
          slug,
          name: nameUz,
          nameRu: get(r, "categoryRu") || null,
          sortOrder: (max._max.sortOrder ?? 0) + 10,
          // New spare-part categories go to the "Ehtiyot qismlar" section.
          isSparePart: /^(ha|yes|да|1|true)$/i.test(get(r, "sparePart")) || /ehtiyot|запчаст|spare/i.test(`${slug} ${nameUz}`),
        },
      });
    }
    categoryCache.set(slug, cat.id);
    return cat.id;
  }

  async function supplierId(name: string): Promise<string | null> {
    if (!name) return null;
    if (supplierCache.has(name)) return supplierCache.get(name)!;
    const s = (await prisma.supplier.findFirst({ where: { name: { equals: name, mode: "insensitive" } } })) ?? (await prisma.supplier.create({ data: { name } }));
    supplierCache.set(name, s.id);
    return s.id;
  }

  for (const [i, r] of rows.entries()) {
    const line = i + 2;
    const sku = get(r, "sku");
    const slugKey = get(r, "slug");
    if (!sku && !slugKey) continue;
    try {
      const existing = await prisma.product.findFirst({ where: sku ? { sku } : { slug: slugKey } });
      const price = n(r, "price");
      const oldPrice = n(r, "oldPrice");
      const costUsd = n(r, "costUsd");
      const cost = n(r, "cost") ?? (costUsd !== null && usdRate ? costUsd * usdRate : null);
      const stock = n(r, "stock");
      const unitRaw = get(r, "unit").toLowerCase();
      const unit = UNIT_ALIASES[unitRaw] ?? (UNITS.includes(unitRaw.toUpperCase() as Unit) ? (unitRaw.toUpperCase() as Unit) : undefined);
      const onRequestRaw = get(r, "priceOnRequest").toLowerCase();
      const priceOnRequest = onRequestRaw
        ? ["1", "ha", "yes", "да", "true"].includes(onRequestRaw)
        : price !== null && price > 0
          ? false
          : undefined;
      const activeRaw = get(r, "active").toLowerCase();
      const active = activeRaw ? ["1", "ha", "yes", "да", "true"].includes(activeRaw) : undefined;
      const image = get(r, "image");
      const imageUrl = image && (image.startsWith("https://") || image.startsWith("/")) ? image : undefined;

      const common = {
        ...(get(r, "name") && { name: get(r, "name") }),
        ...(get(r, "nameRu") && { nameRu: get(r, "nameRu") }),
        ...(get(r, "nameEn") && { nameEn: get(r, "nameEn") }),
        ...(get(r, "brand") && { brand: get(r, "brand") }),
        ...(get(r, "description") && { description: get(r, "description") }),
        ...(get(r, "descriptionRu") && { descriptionRu: get(r, "descriptionRu") }),
        ...(unit && { unit }),
        ...(oldPrice !== null && { oldPrice: Math.round(oldPrice) }),
        ...(cost !== null && { costPrice: Math.round(cost) }),
        ...(imageUrl && { imageUrl }),
        ...(get(r, "compatibleWith") && { compatibleWith: get(r, "compatibleWith") }),
        ...specCols(r),
        ...(priceOnRequest !== undefined && { priceOnRequest }),
      };

      const productId = await prisma.$transaction(async (tx) => {
        let id: string;
        if (existing) {
          const catId = get(r, "category") ? await categoryId(r) : null;
          await tx.product.update({
            where: { id: existing.id },
            data: {
              ...common,
              ...(catId && { categoryId: catId }),
              ...(price !== null && { price: Math.round(price) }),
              // A hidden product with no price becomes visible once it gets a price (unless "faol" says otherwise).
              ...(active !== undefined ? { isActive: active } : price !== null && price > 0 && existing.price === 0 ? { isActive: true } : {}),
            },
          });
          if (price !== null && Math.round(price) !== existing.price) {
            await tx.priceChange.create({ data: { productId: existing.id, oldPrice: existing.price, newPrice: Math.round(price), actor: `${session.name} (CSV)` } });
          }
          id = existing.id;
          updated++;
        } else {
          if (!createMissing) {
            skipped.push(sku || slugKey);
            return null;
          }
          const name = get(r, "name");
          if (!name) throw new Error("yangi mahsulot uchun nomi_uz kerak");
          const catId = await categoryId(r);
          if (!catId) throw new Error("yangi mahsulot uchun kategoriya kerak");
          let slug = slugKey ? slugify(slugKey) : slugify(name);
          if (!slug) slug = slugify(sku);
          if (await tx.product.findUnique({ where: { slug } })) slug = `${slug}-${slugify(sku)}`.slice(0, 100);
          const p = await tx.product.create({
            data: {
              name,
              slug,
              sku: sku || null,
              categoryId: catId,
              price: price !== null ? Math.round(price) : 0,
              isActive: active ?? (price !== null && price > 0),
              ...common,
            },
          });
          id = p.id;
          created++;
        }
        if (stock !== null && warehouse) {
          const level = await tx.stockLevel.findUnique({ where: { productId_warehouseId: { productId: id, warehouseId: warehouse.id } } });
          const delta = Math.round(stock) - (level?.quantity ?? 0);
          if (delta !== 0) await moveStock(tx, { productId: id, warehouseId: warehouse.id, delta, reason: existing ? "CSV_IMPORT" : "OPENING", actor: session.name, allowNegative: true });
        }
        return id;
      });

      const supName = get(r, "supplier");
      if (productId && supName) {
        const sid = await supplierId(supName);
        if (sid) {
          await prisma.productSupplier.upsert({
            where: { productId_supplierId: { productId, supplierId: sid } },
            create: { productId, supplierId: sid, supplierSku: get(r, "supplierSku") || null, priceUsd: costUsd },
            update: { ...(get(r, "supplierSku") && { supplierSku: get(r, "supplierSku") }), ...(costUsd !== null && { priceUsd: costUsd }) },
          });
        }
      }
    } catch (e) {
      errors.push(`${line}-qator (${sku || slugKey}): ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return { created, updated, skipped, errors };
}
