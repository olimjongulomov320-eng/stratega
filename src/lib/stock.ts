import type { Prisma, StockMoveReason } from "@/generated/prisma/client";
import { getMainWarehouseId } from "@/lib/warehouse";

type TxClient = Prisma.TransactionClient;

// Product.stock — barcha omborlar bo'yicha jami qoldiq (denormalizatsiya,
// eski UI/hisobotlar buzilmasligi uchun saqlanadi). Har bir Stock o'zgarishida
// avtomatik qayta hisoblanadi.
async function syncProductTotalStock(
  tx: TxClient,
  productId: string
): Promise<number> {
  const agg = await tx.stock.aggregate({
    where: { productId },
    _sum: { quantity: true },
  });
  const total = agg._sum.quantity ?? 0;

  const product = await tx.product.update({
    where: { id: productId },
    data: { stock: total },
    select: { stock: true, isActive: true },
  });

  // Qoldiq 0 yoki undan kam bo'lsa, mahsulotni avtomatik yashiramiz.
  // Faqat yashirish uchun ishlaydi — qoldiq qayta to'lganda avtomatik
  // ko'rsatilmaydi, chunki admin uni boshqa sababga ko'ra yashirgan bo'lishi mumkin.
  if (product.stock <= 0 && product.isActive) {
    await tx.product.update({
      where: { id: productId },
      data: { isActive: false },
    });
  }

  return total;
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
  allowNegative?: boolean; // false bo'lsa, ombordagi son manfiyga tushishiga yo'l qo'yilmaydi
};

// Ombor qoldig'ini o'zgartirishning yagona yo'li. Stock.quantity va
// Product.stock hech qachon to'g'ridan-to'g'ri yozilmasligi kerak — faqat
// shu funksiya orqali, har doim tx.$transaction ichida chaqiriladi.
export async function recordStockChange(
  tx: TxClient,
  params: RecordStockChangeParams
): Promise<{ stockAfter: number; warehouseId: string; totalStock: number }> {
  const warehouseId = params.warehouseId ?? (await getMainWarehouseId(tx));

  const existing = await tx.stock.findUnique({
    where: {
      productId_warehouseId: { productId: params.productId, warehouseId },
    },
    select: { quantity: true },
  });

  const currentQty = existing?.quantity ?? 0;
  const nextQty = currentQty + params.change;

  // MANUAL/ORDER/IMPORT — mavjud (eski) oqimlar, ular tarixiy sabablarga
  // ko'ra manfiy qoldiqqa tushishga ruxsat berilgan (masalan, параллель
  // arizalar poyga holati). Yangi WMS hujjatlari (RECEIPT/ISSUE/TRANSFER/...)
  // uchun esa manfiyga tushish standart holatda taqiqlanadi.
  const legacyReasonsAllowNegative: string[] = ["MANUAL", "ORDER", "IMPORT"];
  const allowNegative =
    params.allowNegative ?? legacyReasonsAllowNegative.includes(params.reason);

  if (nextQty < 0 && !allowNegative) {
    throw new Error(
      `Omborda yetarli qoldiq yo'q (mavjud: ${currentQty}, so'ralgan chiqim: ${-params.change}).`
    );
  }

  const stock = await tx.stock.upsert({
    where: {
      productId_warehouseId: { productId: params.productId, warehouseId },
    },
    create: {
      productId: params.productId,
      warehouseId,
      quantity: nextQty,
    },
    update: {
      quantity: nextQty,
    },
  });

  await tx.stockMove.create({
    data: {
      productId: params.productId,
      warehouseId,
      change: params.change,
      stockAfter: stock.quantity,
      reason: params.reason,
      note: params.note ?? null,
      requestId: params.requestId ?? null,
      referenceType: params.referenceType ?? null,
      referenceId: params.referenceId ?? null,
      createdBy: params.createdBy ?? null,
    },
  });

  const totalStock = await syncProductTotalStock(tx, params.productId);

  return { stockAfter: stock.quantity, warehouseId, totalStock };
}

// Zaxira (reservation) — mahsulotni jismoniy kamaytirmasdan "band" qilish.
// Available = quantity - reserved. Ruxsat etilgan miqdordan oshib
// zaxiralashga yo'l qo'yilmaydi, agar allowOverReserve belgilanmagan bo'lsa.
export async function reserveStock(
  tx: TxClient,
  params: {
    productId: string;
    warehouseId?: string | null;
    quantity: number; // musbat son
    allowOverReserve?: boolean;
  }
): Promise<{ reserved: number; available: number }> {
  const warehouseId = params.warehouseId ?? (await getMainWarehouseId(tx));

  const stock = await tx.stock.findUnique({
    where: {
      productId_warehouseId: { productId: params.productId, warehouseId },
    },
  });

  const quantity = stock?.quantity ?? 0;
  const currentReserved = stock?.reserved ?? 0;
  const available = quantity - currentReserved;

  if (params.quantity > available && !params.allowOverReserve) {
    throw new Error(
      `Zaxiralash uchun yetarli mavjud qoldiq yo'q (mavjud: ${available}, so'ralgan: ${params.quantity}).`
    );
  }

  const updated = await tx.stock.upsert({
    where: {
      productId_warehouseId: { productId: params.productId, warehouseId },
    },
    create: {
      productId: params.productId,
      warehouseId,
      quantity: 0,
      reserved: params.quantity,
    },
    update: {
      reserved: { increment: params.quantity },
    },
  });

  return { reserved: updated.reserved, available: updated.quantity - updated.reserved };
}

// Zaxirani bo'shatish (bekor qilish yoki jo'natish orqali yopish).
export async function releaseStock(
  tx: TxClient,
  params: { productId: string; warehouseId?: string | null; quantity: number }
): Promise<{ reserved: number; available: number }> {
  const warehouseId = params.warehouseId ?? (await getMainWarehouseId(tx));

  const stock = await tx.stock.findUnique({
    where: {
      productId_warehouseId: { productId: params.productId, warehouseId },
    },
  });

  const nextReserved = Math.max(0, (stock?.reserved ?? 0) - params.quantity);

  const updated = await tx.stock.update({
    where: {
      productId_warehouseId: { productId: params.productId, warehouseId },
    },
    data: { reserved: nextReserved },
  });

  return { reserved: updated.reserved, available: updated.quantity - updated.reserved };
}
