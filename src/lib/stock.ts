import type { Prisma, StockMoveReason } from "@/generated/prisma/client";
import { getMainWarehouseId } from "@/lib/warehouse";
import { getBoolSetting, SETTING_KEYS } from "@/lib/settings";
import { cuid } from "@/lib/id";

type TxClient = Prisma.TransactionClient;

export type StockSnapshot = {
  id: string;
  quantity: number;
  reserved: number;
  available: number;
};

// Product.stock — barcha omborlar bo'yicha jami qoldiq (denormalizatsiya,
// eski UI/hisobotlar buzilmasligi uchun saqlanadi). Har bir Stock o'zgarishida
// avtomatik qayta hisoblanadi.
async function syncProductTotalStock(
  tx: TxClient,
  productId: string
): Promise<number> {
  // Mahsulot qatorini bloklaymiz — parallel ombor operatsiyalari
  // (turli omborlar) jami qoldiqni noto'g'ri hisoblamasligi uchun.
  // Barcha yo'llar bir xil tartibda bloklaydi (Stock -> Product), shuning
  // uchun deadlock bo'lmaydi.
  //
  // Bloklash va agregatsiya ALMASHIDA alohida statement'lar bo'lishi
  // muhim: Postgres'da har bir statement o'z snapshot'ini oladi. Agar
  // bitta statement'da bloklashtirib agregatsiya qilsak, kutayotgan
  // tranzaksiya eski snapshot'dan foydalanib jami qoldiqni noto'g'ri
  // hisoblardi.
  await tx.$executeRaw`SELECT id FROM "Product" WHERE id = ${productId} FOR UPDATE`;

  // Jami qoldiqni bitta statement'da hisoblab, Product.stock ni yangilash.
  const rows = await tx.$queryRaw<{ stock: number; isActive: boolean }[]>`
    WITH agg AS (
      SELECT COALESCE(SUM("quantity"), 0)::int AS q
      FROM "Stock" WHERE "productId" = ${productId}
    )
    UPDATE "Product" p
    SET "stock" = agg.q,
        "isActive" = CASE WHEN agg.q <= 0 THEN false ELSE p."isActive" END
    FROM agg
    WHERE p.id = ${productId}
    RETURNING p."stock", p."isActive"
  `;

  return Number(rows[0]?.stock ?? 0);
}

/**
 * Qoldiq qatorini topadi (yo'q bo'lsa yaratadi) va TRZAKSIYA DAVOMIDA
 * bloklaydi (`SELECT ... FOR UPDATE`).
 *
 * Nima uchun bu muhim: `read -> yozish` (o'qib, keyin yozish) usuli
 * parallel tranzaksiyalarda "lost update" ga olib keladi — ikkala
 * tranzaksiya ham eski qiymatni o'qib, ikkalasi ham o'z o'zgarishini
 * yozadi va biri yo'qoladi. Qator bloklanganda ikkinchi tranzaksiya
 * birinchisining tugashini kutadi va yangi qiymatni ko'radi.
 */
export async function lockStock(
  tx: TxClient,
  productId: string,
  warehouseId: string
): Promise<StockSnapshot> {
  // 1) Odatiy holat: qator allaqachon mavjud — faqat bloklaymiz (1 round-trip).
  const existing = await tx.$queryRaw<{
    id: string;
    quantity: number;
    reserved: number;
  }[]>`
    SELECT "id","quantity","reserved" FROM "Stock"
    WHERE "productId" = ${productId} AND "warehouseId" = ${warehouseId}
    FOR UPDATE
  `;

  let row = existing[0];

  if (!row) {
    // 2) Qator yo'q — parallel xavfsiz yaratamiz va bloklaymiz.
    //    ON CONFLICT DO NOTHING: boshqa tranzaksiya bir vaqtda yaratgan
    //    bo'lsa, biz uning tugashini kutamiz va qatorni o'z holicha
    //    olamiz (o'zimizning insert'imiz bekor qilinadi).
    await tx.$executeRaw`
      INSERT INTO "Stock" ("id","productId","warehouseId","quantity","reserved","updatedAt")
      VALUES (${cuid()}, ${productId}, ${warehouseId}, 0, 0, NOW())
      ON CONFLICT ("productId","warehouseId") DO NOTHING
    `;

    const created = await tx.$queryRaw<{
      id: string;
      quantity: number;
      reserved: number;
    }[]>`
      SELECT "id","quantity","reserved" FROM "Stock"
      WHERE "productId" = ${productId} AND "warehouseId" = ${warehouseId}
      FOR UPDATE
    `;
    row = created[0];
  }

  if (!row) {
    throw new Error("Ombor qoldig''ini bloklash mumkin bo''lmadi.");
  }
  const quantity = Number(row.quantity);
  const reserved = Number(row.reserved);
  return { id: row.id, quantity, reserved, available: quantity - reserved };
}

export type RecordStockChangeParams = {
  productId: string;
  change: number; // musbat — kirim, manfiy — chiqim
  reason: StockMoveReason;
  warehouseId?: string | null; // berilmasa — Asosiy ombor
  note?: string | null;
  requestId?: string | null; // eskirgan RfqRequest bog'lanishi uchun
  referenceType?: string | null;
  referenceId?: string | null;
  createdBy?: string | null;
};

/**
 * Ombor qoldig'ini o'zgartirishning yagona yo'li. Stock.quantity va
 * Product.stock hech qachon to'g'ridan-to'g'ri yozilmasligi kerak — faqat
 * shu funksiya orqali, har doim tx.$transaction ichida chaqiriladi.
 *
 * Har doim: (1) qator bloklanadi, (2) balans tekshiriladi, (3) yoziladi,
 * (4) jurnalda iz qoldiriladi.
 */
export async function recordStockChange(
  tx: TxClient,
  params: RecordStockChangeParams
): Promise<{ stockAfter: number; warehouseId: string; totalStock: number }> {
  if (!Number.isInteger(params.change) || params.change === 0) {
    throw new Error("Ombor o'zgarishi nolga teng bo'lmaydi.");
  }

  const warehouseId = params.warehouseId ?? (await getMainWarehouseId(tx));

  const current = await lockStock(tx, params.productId, warehouseId);
  const nextQty = current.quantity + params.change;

  if (nextQty < 0) {
    // Administrator "stock.allowNegative" sozlamasini yoqigan bo'lsa —
    // manfiy qoldiqga ruxsat beriladi (baza trigger'i ham shuni tekshiradi).
    const allowNegative = await getBoolSetting(SETTING_KEYS.ALLOW_NEGATIVE_STOCK);
    if (!allowNegative) {
      throw new Error(
        `Omborda yetarli qoldiq yo'q (mavjud: ${current.quantity}, so'ralgan chiqim: ${-params.change}).`
      );
    }
  }

  await tx.stock.update({
    where: { id: current.id },
    data: { quantity: nextQty },
  });

  await tx.stockMove.create({
    data: {
      productId: params.productId,
      warehouseId,
      change: params.change,
      stockAfter: nextQty,
      reason: params.reason,
      note: params.note ?? null,
      requestId: params.requestId ?? null,
      referenceType: params.referenceType ?? null,
      referenceId: params.referenceId ?? null,
      createdBy: params.createdBy ?? null,
    },
  });

  const totalStock = await syncProductTotalStock(tx, params.productId);

  return { stockAfter: nextQty, warehouseId, totalStock };
}

/**
 * Zaxira (reservation) — mahsulotni jismoniy kamaytirmasdan "band" qilish.
 * Available = quantity - reserved. Ruxsat etilgan miqdordan oshib
 * zaxiralashga yo'l qo'yilmaydi, agar allowOverReserve belgilanmagan bo'lsa.
 */
export async function reserveStock(
  tx: TxClient,
  params: {
    productId: string;
    warehouseId?: string | null;
    quantity: number; // musbat son
    allowOverReserve?: boolean;
  }
): Promise<{ reserved: number; available: number }> {
  if (!Number.isInteger(params.quantity) || params.quantity <= 0) {
    throw new Error("Zaxiralash miqdori musbat butun son bo'lishi kerak.");
  }

  const warehouseId = params.warehouseId ?? (await getMainWarehouseId(tx));
  const current = await lockStock(tx, params.productId, warehouseId);

  if (params.quantity > current.available && !params.allowOverReserve) {
    throw new Error(
      `Zaxiralash uchun yetarli mavjud qoldiq yo'q (mavjud: ${current.available}, so'ralgan: ${params.quantity}).`
    );
  }

  const nextReserved = current.reserved + params.quantity;

  await tx.stock.update({
    where: { id: current.id },
    data: { reserved: nextReserved },
  });

  return { reserved: nextReserved, available: current.quantity - nextReserved };
}

/**
 * Zaxirani bo'shatish (bekor qilish yoki jo'natish orqali yopish).
 *
 * DIQQAT: avvalgi implementatsiya `Math.max(0, ...)` bilan zaxirani
 * "kesib" tashlaydi — bu esa xato (ortiqcha bo'shatish)ni jimgina
 * yashirib qoldiradi va kelginda "available" hisobini buzadi. Endi ortiqcha
 * bo'shatish aniq xato bilan to'xtatiladi.
 */
export async function releaseStock(
  tx: TxClient,
  params: {
    productId: string;
    warehouseId?: string | null;
    quantity: number;
    allowOverRelease?: boolean;
  }
): Promise<{ reserved: number; available: number }> {
  if (!Number.isInteger(params.quantity) || params.quantity <= 0) {
    throw new Error("Zaxirani bo'shatish miqdori musbat butun son bo'lishi kerak.");
  }

  const warehouseId = params.warehouseId ?? (await getMainWarehouseId(tx));
  const current = await lockStock(tx, params.productId, warehouseId);

  if (params.quantity > current.reserved && !params.allowOverRelease) {
    throw new Error(
      `Bo'shatilayotgan zaxira mavjud zaxiradan ko'p: mavjud zaxira ${current.reserved}, so'ralgan ${params.quantity}.`
    );
  }

  const nextReserved = current.reserved - params.quantity;

  await tx.stock.update({
    where: { id: current.id },
    data: { reserved: nextReserved },
  });

  return { reserved: nextReserved, available: current.quantity - nextReserved };
}

/**
 * Berilgan mahsulotlar uchun ombor qoldiqlarini bloklab oladi.
 * Bir tranzaksiyada bir nechta mahsulotni o'zgartirishda deadlock'ni
 * oldini olish uchun mahsulotlar `productId` bo'yicha saralanadi —
 * barcha tranzaksiyalar bir xil tartibda bloklaydi.
 */
export async function lockStocks(
  tx: TxClient,
  entries: { productId: string; warehouseId?: string | null }[]
): Promise<Map<string, StockSnapshot>> {
  const sorted = [...entries].sort((a, b) =>
    a.productId < b.productId ? -1 : a.productId > b.productId ? 1 : 0
  );

  const result = new Map<string, StockSnapshot>();
  for (const entry of sorted) {
    const warehouseId = entry.warehouseId ?? (await getMainWarehouseId(tx));
    const snapshot = await lockStock(tx, entry.productId, warehouseId);
    result.set(`${entry.productId}:${warehouseId}`, snapshot);
  }
  return result;
}
