import type { Prisma, StockDocumentType } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { recordStockChange } from "@/lib/stock";
import { writeAuditLog } from "@/lib/audit";

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
  type: StockDocumentType
): Promise<string> {
  const prefix = NUMBER_PREFIX[type];
  const count = await prisma.stockDocument.count({ where: { type } });
  return `${prefix}-${String(count + 1).padStart(6, "0")}`;
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

export async function createStockDocument(
  input: CreateStockDocumentInput,
  actorId?: string | null
) {
  if (input.items.length === 0) {
    throw new Error("Hujjatda kamida bitta mahsulot bo'lishi kerak.");
  }
  if (input.type === "TRANSFER" && !input.destWarehouseId) {
    throw new Error("Ko'chirish hujjati uchun manzil ombor tanlanishi shart.");
  }
  if (input.type === "TRANSFER" && input.destWarehouseId === input.warehouseId) {
    throw new Error("Manba va manzil ombor bir xil bo'lishi mumkin emas.");
  }

  const number = await generateDocumentNumber(input.type);

  const document = await prisma.$transaction(async (tx) => {
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

  return document;
}

// Hujjatni "проводка" qilish — haqiqiy ombor operatsiyasini bajaradi.
// Faqat DRAFT holatidagi hujjatlar проводка qilinishi mumkin.
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
        `Faqat qoralama (DRAFT) hujjatlar проводка qilinadi. Hozirgi holat: ${doc.status}.`
      );
    }

    for (const item of doc.items) {
      await applyDocumentItemStockChange(tx, doc, item.productId, item.quantity);
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
  quantity: number
) {
  const reference = { referenceType: "StockDocument", referenceId: doc.id };

  switch (doc.type) {
    case "RECEIPT":
      await recordStockChange(tx, {
        productId,
        warehouseId: doc.warehouseId,
        change: quantity,
        reason: "RECEIPT",
        note: `Kirim hujjati ${doc.number}`,
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
          allowNegative: true,
          ...reference,
        });
      }
      break;
    }

    case "TRANSFER": {
      if (!doc.destWarehouseId) {
        throw new Error("Ko'chirish hujjatida manzil ombor yo'q.");
      }
      await recordStockChange(tx, {
        productId,
        warehouseId: doc.warehouseId,
        change: -quantity,
        reason: "TRANSFER_OUT",
        note: `Ko'chirish hujjati ${doc.number}`,
        ...reference,
      });
      await recordStockChange(tx, {
        productId,
        warehouseId: doc.destWarehouseId,
        change: quantity,
        reason: "TRANSFER_IN",
        note: `Ko'chirish hujjati ${doc.number}`,
        ...reference,
      });
      break;
    }
  }
}

// Hujjatni bekor qilish. POSTED hujjat bekor qilinsa, teskari harakat
// (reversal) yoziladi — hech qachon jim tarzda qoldiqni to'g'ridan-to'g'ri
// o'zgartirmaymiz.
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
      // Teskari harakatlarni yozamiz (проводкani "ажратмаймиз", faqat
      // qarama-qarshi StockMove qo'shamiz — audit iz saqlanib qoladi).
      for (const item of doc.items) {
        await reverseDocumentItemStockChange(tx, doc, item.productId, item.quantity);
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

async function reverseDocumentItemStockChange(
  tx: TxClient,
  doc: { id: string; type: StockDocumentType; warehouseId: string; destWarehouseId: string | null; number: string },
  productId: string,
  quantity: number
) {
  const reference = { referenceType: "StockDocument", referenceId: doc.id };
  const note = `Hujjat ${doc.number} bekor qilindi`;

  switch (doc.type) {
    case "RECEIPT":
    case "RETURN":
      await recordStockChange(tx, {
        productId,
        warehouseId: doc.warehouseId,
        change: -quantity,
        reason: doc.type === "RECEIPT" ? "RECEIPT" : "RETURN",
        note,
        allowNegative: true,
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
        ...reference,
      });
      await recordStockChange(tx, {
        productId,
        warehouseId: doc.destWarehouseId,
        change: -quantity,
        reason: "TRANSFER_OUT",
        note,
        allowNegative: true,
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
