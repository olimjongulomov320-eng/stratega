import type { Prisma, StockDocumentType } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { recordStockChange } from "@/lib/stock";
import { writeAuditLog } from "@/lib/audit";
import { nextBusinessNumber } from "@/lib/numbers";

type TxClient = Prisma.TransactionClient;

// Hujjat raqamlarini generatsiya qilish: RCP-000001, ISS-000001, ...
const NUMBER_PREFIX: Record<StockDocumentType, string> = {
  RECEIPT: "RCP",
  ISSUE: "ISS",
  TRANSFER: "TRF",
  WRITE_OFF: "WOF",
  INVENTORY: "INV",
  RETURN: "RET",
};

export async function generateDocumentNumber(
  type: StockDocumentType,
  tx?: TxClient
): Promise<string> {
  return nextBusinessNumber("stockDocument", { prefix: NUMBER_PREFIX[type] }, tx);
}

export type StockDocumentItemInput = {
  productId: string;
  quantity: number;
  price?: number | null;
};

export type CreateStockDocumentInput = {
  type: StockDocumentType;
  warehouseId: string;
  destWarehouseId?: string | null; // faqat TRANSFER uchun
  supplierId?: string | null; // faqat RECEIPT uchun ma'noli
  responsibleId?: string | null;
  note?: string | null;
  items: StockDocumentItemInput[];
};

function validateItems(items: StockDocumentItemInput[]) {
  if (items.length === 0) {
    throw new Error("Hujjatda kamida bitta mahsulot bo'lishi kerak.");
  }
  for (const item of items) {
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new Error("Hujjat miqdori musbat butun son bo'lishi kerak.");
    }
    if (item.price !== undefined && item.price !== null && item.price < 0) {
      throw new Error("Hujjat narxi manfiy bo'lishi mumkin emas.");
    }
  }
}

// Bir xil mahsulot hujjatda takrorlanmasligi kerak — aks holda bir mahsulot
// uchun bir nechta qator bo'lib, "qolgan miqdor" hisobi chalkashadi.
function validateNoDuplicates(items: StockDocumentItemInput[]) {
  const seen = new Set<string>();
  for (const item of items) {
    if (seen.has(item.productId)) {
      throw new Error("Hujjatda bir xil mahsulot bir necha marta kiritilgan.");
    }
    seen.add(item.productId);
  }
}

export async function createStockDocument(
  input: CreateStockDocumentInput,
  actorId?: string | null
) {
  validateItems(input.items);
  validateNoDuplicates(input.items);
  if (input.type === "TRANSFER" && !input.destWarehouseId) {
    throw new Error("Ko'chirish hujjati uchun manzil ombor tanlanishi shart.");
  }
  if (input.type === "TRANSFER" && input.destWarehouseId === input.warehouseId) {
    throw new Error("Manba va manzil ombor bir xil bo'lishi mumkin emas.");
  }

  return prisma.$transaction(async (tx) => {
    const number = await generateDocumentNumber(input.type, tx);
    const doc = await tx.stockDocument.create({
      data: {
        number,
        type: input.type,
        warehouseId: input.warehouseId,
        destWarehouseId: input.destWarehouseId ?? null,
        supplierId: input.supplierId ?? null,
        responsibleId: input.responsibleId ?? null,
        note: input.note ?? null,
        items: {
          create: input.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price ?? null,
          })),
        },
      },
      include: { items: true },
    });

    await writeAuditLog(
      {
        actorId,
        action: "stock_document.create",
        entity: "StockDocument",
        entityId: doc.id,
        newData: { number: doc.number, type: doc.type },
      },
      tx
    );

    return doc;
  });
}

/**
 * Hujjatni "проводка" qilish — haqiqiy ombor operatsiyasini bajaradi.
 * Faqat DRAFT holatidagi hujjatlar проводka qilinishi mumkin.
 */
export async function postStockDocument(
  documentId: string,
  actorId?: string | null
) {
  await prisma.$transaction(async (tx) => {
    const doc = await tx.stockDocument.findUniqueOrThrow({
      where: { id: documentId },
      include: { items: true },
    });

    if (doc.status !== "DRAFT") {
      throw new Error(
        `Faqat qoralama (DRAFT) hujjat qayd etiladi. Hozirgi holat: ${doc.status}.`
      );
    }

    // Mahsulotlar `productId` bo'yicha tartiblanadi — barcha tranzaksiyalar
    // bir xil tartibda bloklaydi (deadlock himoyasi).
    const items = [...doc.items].sort((a, b) =>
      a.productId < b.productId ? -1 : a.productId > b.productId ? 1 : 0
    );

    for (const item of items) {
      await applyDocumentItemStockChange(tx, doc, item.productId, item.quantity, actorId);
    }

    await tx.stockDocument.update({
      where: { id: documentId },
      data: { status: "POSTED", postedAt: new Date() },
    });

    await writeAuditLog(
      {
        actorId,
        action: "stock_document.post",
        entity: "StockDocument",
        entityId: doc.id,
        newData: { number: doc.number, type: doc.type },
      },
      tx
    );
  });
}

async function applyDocumentItemStockChange(
  tx: TxClient,
  doc: { id: string; type: StockDocumentType; warehouseId: string; destWarehouseId: string | null; number: string },
  productId: string,
  quantity: number,
  actorId?: string | null
) {
  const reference = { referenceType: "StockDocument", referenceId: doc.id };
  const createdBy = actorId ?? null;

  switch (doc.type) {
    case "RECEIPT":
      await recordStockChange(tx, {
        productId,
        warehouseId: doc.warehouseId,
        change: quantity,
        reason: "RECEIPT",
        note: `Kirim hujjati ${doc.number}`,
        createdBy,
        ...reference,
      });
      break;

    case "ISSUE":
      await recordStockChange(tx, {
        productId,
        warehouseId: doc.warehouseId,
        change: -quantity,
        reason: "ISSUE",
        note: `Chiqim hujjati ${doc.number}`,
        createdBy,
        ...reference,
      });
      break;

    case "RETURN":
      await recordStockChange(tx, {
        productId,
        warehouseId: doc.warehouseId,
        change: quantity,
        reason: "RETURN",
        note: `Qaytarish hujjati ${doc.number}`,
        createdBy,
        ...reference,
      });
      break;

    case "WRITE_OFF":
      await recordStockChange(tx, {
        productId,
        warehouseId: doc.warehouseId,
        change: -quantity,
        reason: "WRITE_OFF",
        note: `Hisobdan chiqarish hujjati ${doc.number}`,
        createdBy,
        ...reference,
      });
      break;

    case "INVENTORY": {
      // Inventarizatsiya — item.quantity YANGI (haqiqiy sanoq) qiymatni
      // bildiradi, delta emas. Farqni hisoblab, tuzatish yozamiz.
      const warehouseId = doc.warehouseId;
      const current = await tx.stock.findUnique({
        where: { productId_warehouseId: { productId, warehouseId } },
        select: { quantity: true },
      });
      const delta = quantity - (current?.quantity ?? 0);
      if (delta !== 0) {
        await recordStockChange(tx, {
          productId,
          warehouseId,
          change: delta,
          reason: "INVENTORY_ADJUSTMENT",
          note: `Inventarizatsiya hujjati ${doc.number}`,
          createdBy,
          ...reference,
        });
      }
      break;
    }

    case "TRANSFER": {
      if (!doc.destWarehouseId) {
        throw new Error("Ko'chirish hujjatida manzil ombor yo'q.");
      }
      // Manbadan chiqarish va manzilga kiritish — bitta tranzaksiyada.
      await recordStockChange(tx, {
        productId,
        warehouseId: doc.warehouseId,
        change: -quantity,
        reason: "TRANSFER_OUT",
        note: `Ko'chirish hujjati ${doc.number}`,
        createdBy,
        ...reference,
      });
      await recordStockChange(tx, {
        productId,
        warehouseId: doc.destWarehouseId,
        change: quantity,
        reason: "TRANSFER_IN",
        note: `Ko'chirish hujjati ${doc.number}`,
        createdBy,
        ...reference,
      });
      break;
    }
  }
}

/**
 * Hujjatni bekor qilish. POSTED hujjat bekor qilinsa, teskari harakat
 * (reversal) yoziladi — hech qachon jim tarzda qoldiqni to'g'ridan-to'g'ri
 * o'zgartirmaymiz.
 *
 * Teskari harakat qoldiqni manfiyga tushirsa — bekor qilish rad etiladi va
 * foydalanuvchiga aniq ko'rsatma beriladi ("chiqim hujjati yarating").
 * Sabab: "manfiy qoldiq" — bu ma'lumot buzilishi.
 */
export async function cancelStockDocument(
  documentId: string,
  actorId?: string | null
) {
  await prisma.$transaction(async (tx) => {
    const doc = await tx.stockDocument.findUniqueOrThrow({
      where: { id: documentId },
      include: { items: true },
    });

    if (doc.status === "CANCELLED") {
      throw new Error("Hujjat allaqachon bekor qilingan.");
    }

    if (doc.status === "POSTED") {
      // Teskari harakat qoldiqni manfiyga tushirmasligini oldindan tekshiramiz.
      await assertReversible(tx, doc);

      const items = [...doc.items].sort((a, b) =>
        a.productId < b.productId ? -1 : a.productId > b.productId ? 1 : 0
      );
      for (const item of items) {
        await reverseDocumentItemStockChange(tx, doc, item.productId, item.quantity, actorId);
      }
    }

    await tx.stockDocument.update({
      where: { id: documentId },
      data: { status: "CANCELLED" },
    });

    await writeAuditLog(
      {
        actorId,
        action: "stock_document.cancel",
        entity: "StockDocument",
        entityId: doc.id,
        newData: { number: doc.number },
      },
      tx
    );
  });
}

/**
 * Bekor qilish qoldiqni manfiyga tushiradimi? tekshiradi.
 * Manfiyga tushsa — aniq, harakatcha xato bilan rad etadi.
 */
async function assertReversible(
  tx: TxClient,
  doc: {
    type: StockDocumentType;
    warehouseId: string;
    destWarehouseId: string | null;
    number: string;
    items: { productId: string; quantity: number }[];
  }
): Promise<void> {
  const balances = await tx.stock.findMany({
    where: {
      productId: { in: doc.items.map((i) => i.productId) },
      OR: [
        { warehouseId: doc.warehouseId },
        ...(doc.destWarehouseId ? [{ warehouseId: doc.destWarehouseId }] : []),
      ],
    },
    select: { productId: true, warehouseId: true, quantity: true, reserved: true },
  });

  const balanceOf = (productId: string, warehouseId: string) =>
    balances.find((b) => b.productId === productId && b.warehouseId === warehouseId);

  for (const item of doc.items) {
    switch (doc.type) {
      case "RECEIPT":
      case "RETURN": {
        const balance = balanceOf(item.productId, doc.warehouseId);
        const available = balance?.quantity ?? 0;
        if (available < item.quantity) {
          throw new Error(
            `Hujjat ${doc.number} ni bekor qilib bo'lmaydi: ombordagi qoldiq (${available}) qaytarilayotgan miqdordan (${item.quantity}) kam. Mahsulot allaqachon sarflangan — chiqim (WRITE_OFF) hujjati yarating.`
          );
        }
        // Qoldiqni kamaytirsak, band (reserved) miqdori qoldiqdan oshmasligi kerak.
        if ((balance?.reserved ?? 0) > available - item.quantity) {
          throw new Error(
            `Hujjat ${doc.number} ni bekor qilib bo'lmaydi: mahsulot buyurtmalar uchun band qilingan (zaxira ${balance?.reserved ?? 0}). Avval bandlangan buyurtmalarni bekor qiling.`
          );
        }
        break;
      }
      case "ISSUE":
      case "WRITE_OFF":
        // Teskari harakat qoldiqni oshiradi — manfiy qoldiq xavfi yo'q.
        break;
      case "TRANSFER": {
        if (!doc.destWarehouseId) break;
        const destBalance = balanceOf(item.productId, doc.destWarehouseId);
        const destAvailable = destBalance?.quantity ?? 0;
        if (destAvailable < item.quantity) {
          throw new Error(
            `Hujjat ${doc.number} ni bekor qilib bo'lmaydi: manzil ombordagi qoldiq (${destAvailable}) qaytarilayotgan miqdordan (${item.quantity}) kam — ko'chirilgan tovar allaqachon sarflangan.`
          );
        }
        if ((destBalance?.reserved ?? 0) > destAvailable - item.quantity) {
          throw new Error(
            `Hujjat ${doc.number} ni bekor qilib bo'lmaydi: manzil ombordagi mahsulot band qilingan (zaxira ${destBalance?.reserved ?? 0}).`
          );
        }
        break;
      }
      case "INVENTORY":
        // Inventarizatsiya natijasi haqiqiy sanoq — bekor qilish ma'nosiz.
        break;
    }
  }
}

async function reverseDocumentItemStockChange(
  tx: TxClient,
  doc: { id: string; type: StockDocumentType; warehouseId: string; destWarehouseId: string | null; number: string },
  productId: string,
  quantity: number,
  actorId?: string | null
) {
  const reference = { referenceType: "StockDocument", referenceId: doc.id };
  const note = `Hujjat ${doc.number} bekor qilindi`;
  const createdBy = actorId ?? null;

  switch (doc.type) {
    case "RECEIPT":
    case "RETURN":
      await recordStockChange(tx, {
        productId,
        warehouseId: doc.warehouseId,
        change: -quantity,
        reason: doc.type === "RECEIPT" ? "RECEIPT" : "RETURN",
        note,
        createdBy,
        ...reference,
      });
      break;
    case "ISSUE":
    case "WRITE_OFF":
      await recordStockChange(tx, {
        productId,
        warehouseId: doc.warehouseId,
        change: quantity,
        reason: doc.type === "ISSUE" ? "ISSUE" : "WRITE_OFF",
        note,
        createdBy,
        ...reference,
      });
      break;
    case "TRANSFER":
      if (!doc.destWarehouseId) break;
      await recordStockChange(tx, {
        productId,
        warehouseId: doc.warehouseId,
        change: quantity,
        reason: "TRANSFER_IN",
        note,
        createdBy,
        ...reference,
      });
      await recordStockChange(tx, {
        productId,
        warehouseId: doc.destWarehouseId,
        change: -quantity,
        reason: "TRANSFER_OUT",
        note,
        createdBy,
        ...reference,
      });
      break;
    case "INVENTORY":
      // Inventarizatsiya tuzatishini bekor qilish ma'nosiz — o'tkazib
      // yuboriladi (haqiqiy sanoq natijasi hujjatdan tashqarida ham
      // haqiqat bo'lib qoladi).
      break;
  }
}
