import "dotenv/config"; // .env ni yuklash — prisma clientidan OLDIN bo'lishi shart
// Ombor (stock) integratsiya testlari — HAQIQIY PostgreSQL ustida.
//
// Ishga tushirish: npm test
//
// Testlar izolyatsiyalangan ma'lumot yaratadi va tugagandan keyin
// butunlay o'chiradi — real ma'lumotga tegilmaydi.
//
// Yo'nalishlar:
//   B — kirim hujjati (0 -> 100)
//   C — zaxiralash va yozish (reserve -> fulfil)
//   D — omborlararo ko'chirish
//   E — yetarli qoldiq yo'q holati
//   +  — o'zgarishlar takrorlanmasligi, bekor qilish, ledger izi

import { dbTestsEnabled } from "./helpers/guard";
import { sweepTestData } from "./helpers/sweep";
import { test, describe, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "@/lib/prisma";
import {
  createFixtures,
  cleanupFixtures,
  readStock,
  readTotalStock,
  type Fixtures,
} from "./helpers/fixtures";
import { recordStockChange, reserveStock, releaseStock } from "@/lib/stock";
import {
  createStockDocument,
  postStockDocument,
  cancelStockDocument,
} from "@/lib/stock-documents";

let f: Fixtures;

before(async () => {
  if (!dbTestsEnabled) return;
  f = await createFixtures();
});

after(async () => {
  if (!dbTestsEnabled) {
    await prisma.$disconnect();
    return;
  }
  await sweepTestData();
  await cleanupFixtures(f);
  await prisma.$disconnect();
});

beforeEach(async () => {
  if (!dbTestsEnabled) return;
  // Har bir test oldidan ombor tozalanadi (boshlang'ich 0).
  await prisma.stockMove.deleteMany({ where: { productId: { in: f.productIds } } });
  await prisma.stock.deleteMany({ where: { productId: { in: f.productIds } } });
  await prisma.product.updateMany({
    where: { id: { in: f.productIds } },
    data: { stock: 0, isActive: true, soldCount: 0 },
  });
});

describe("Test B — kirim hujjati (Stock receipt)", { skip: !dbTestsEnabled }, () => {
  test("0 dan 100 ta kirim: fizik 100, zaxira 0, mavjud 100, ledger yozuvi bor", async () => {
    assert.equal((await readStock(f.productId, f.warehouseId)).quantity, 0);

    const doc = await createStockDocument(
      {
        type: "RECEIPT",
        warehouseId: f.warehouseId,
        supplierId: f.supplierId,
        items: [{ productId: f.productId, quantity: 100, price: 60_000 }],
      },
      f.employeeId
    );

    assert.equal(doc.status, "DRAFT", "hujjat DRAFT bilan yaratiladi");

    await postStockDocument(doc.id, f.employeeId);

    const stock = await readStock(f.productId, f.warehouseId);
    assert.equal(stock.quantity, 100, "fizik qoldiq 100 bo'lishi kerak");
    assert.equal(stock.reserved, 0, "zaxira 0 bo'lishi kerak");
    assert.equal(stock.available, 100, "mavjud qoldiq 100 bo'lishi kerak");

    // Ledger yozuvi
    const moves = await prisma.stockMove.findMany({
      where: { productId: f.productId, referenceType: "StockDocument", referenceId: doc.id },
    });
    assert.equal(moves.length, 1, "bitta RECEIPT ledger yozuvi bo'lishi kerak");
    assert.equal(moves[0]!.change, 100);
    assert.equal(moves[0]!.stockAfter, 100);
    assert.equal(moves[0]!.reason, "RECEIPT");
    assert.equal(moves[0]!.createdBy, f.employeeId, "jurnal kim tomondan yozilganini saqlashi kerak");

    // Hujjat holati
    const posted = await prisma.stockDocument.findUniqueOrThrow({ where: { id: doc.id } });
    assert.equal(posted.status, "POSTED");
    assert.ok(posted.postedAt, "postedAt to'ldirilishi kerak");

    // Product.stock denormalizatsiyasi
    assert.equal(await readTotalStock(f.productId), 100);
  });

  test("qayd etilgan hujjatni qayta qayd etish mumkin emas", async () => {
    const doc = await createStockDocument(
      {
        type: "RECEIPT",
        warehouseId: f.warehouseId,
        items: [{ productId: f.productId, quantity: 10 }],
      },
      f.employeeId
    );
    await postStockDocument(doc.id, f.employeeId);
    await assert.rejects(() => postStockDocument(doc.id, f.employeeId), /DRAFT/);
    assert.equal((await readStock(f.productId, f.warehouseId)).quantity, 10, "ikkinchi marta yozilmasligi kerak");
  });
});

describe("Test C — zaxiralash va yozish (Reservation & fulfilment)", { skip: !dbTestsEnabled }, () => {
  test("100 fizik -> 25 zaxira (fizik 100, mavjud 75) -> yozish (fizik 75, zaxira 0)", async () => {
    await prisma.$transaction(async (tx) => {
      await recordStockChange(tx, {
        productId: f.productId,
        warehouseId: f.warehouseId,
        change: 100,
        reason: "RECEIPT",
      });
    });

    const reserved = await prisma.$transaction(async (tx) =>
      reserveStock(tx, {
        productId: f.productId,
        warehouseId: f.warehouseId,
        quantity: 25,
      })
    );
    assert.equal(reserved.reserved, 25);
    assert.equal(reserved.available, 75);

    let stock = await readStock(f.productId, f.warehouseId);
    assert.equal(stock.quantity, 100, "zaxiralash fizik qoldiqni o'zgartirmasligi kerak");
    assert.equal(stock.reserved, 25);
    assert.equal(stock.available, 75);

    // Yozish (fulfilment): zaxira bo'shatiladi, fizik kamayadi.
    await prisma.$transaction(async (tx) => {
      await releaseStock(tx, {
        productId: f.productId,
        warehouseId: f.warehouseId,
        quantity: 25,
      });
      await recordStockChange(tx, {
        productId: f.productId,
        warehouseId: f.warehouseId,
        change: -25,
        reason: "ISSUE",
      });
    });

    stock = await readStock(f.productId, f.warehouseId);
    assert.equal(stock.quantity, 75);
    assert.equal(stock.reserved, 0);
    assert.equal(stock.available, 75);
  });

  test("mavjud qoldiqdan ko'p zaxiralash rad etiladi", async () => {
    await prisma.$transaction(async (tx) => {
      await recordStockChange(tx, {
        productId: f.productId,
        warehouseId: f.warehouseId,
        change: 10,
        reason: "RECEIPT",
      });
    });

    await assert.rejects(
      () =>
        prisma.$transaction(async (tx) =>
          reserveStock(tx, {
            productId: f.productId,
            warehouseId: f.warehouseId,
            quantity: 11,
          })
        ),
      /yetarli mavjud qoldiq/
    );

    const stock = await readStock(f.productId, f.warehouseId);
    assert.equal(stock.reserved, 0, "rad etilgan zaxiralash iz qoldirmasligi kerak");
  });

  test("ortiqcha bo'shatish xato bilan rad etiladi (jimgina kesilmaydi)", async () => {
    await prisma.$transaction(async (tx) => {
      await recordStockChange(tx, {
        productId: f.productId,
        warehouseId: f.warehouseId,
        change: 10,
        reason: "RECEIPT",
      });
      await reserveStock(tx, {
        productId: f.productId,
        warehouseId: f.warehouseId,
        quantity: 4,
      });
    });

    await assert.rejects(
      () =>
        prisma.$transaction(async (tx) =>
          releaseStock(tx, {
            productId: f.productId,
            warehouseId: f.warehouseId,
            quantity: 5,
          })
        ),
      /mavjud zaxira/
    );

    const stock = await readStock(f.productId, f.warehouseId);
    assert.equal(stock.reserved, 4, "rad etilgan bo'shatish zaxirani o'zgartirmasligi kerak");
  });
});

describe("Test D — omborlararo ko'chirish (Transfer)", { skip: !dbTestsEnabled }, () => {
  test("A omborida 100, B omborida 0 -> 20 ko'chiriladi: A=80, B=20, jami 100", async () => {
    await prisma.$transaction(async (tx) => {
      await recordStockChange(tx, {
        productId: f.productId,
        warehouseId: f.warehouseId,
        change: 100,
        reason: "RECEIPT",
      });
    });

    const doc = await createStockDocument(
      {
        type: "TRANSFER",
        warehouseId: f.warehouseId,
        destWarehouseId: f.secondWarehouseId,
        items: [{ productId: f.productId, quantity: 20 }],
      },
      f.employeeId
    );
    await postStockDocument(doc.id, f.employeeId);

    const a = await readStock(f.productId, f.warehouseId);
    const b = await readStock(f.productId, f.secondWarehouseId);
    assert.equal(a.quantity, 80, "manba ombor 80 qolishi kerak");
    assert.equal(b.quantity, 20, "manzil ombor 20 bo'lishi kerak");
    assert.equal(a.quantity + b.quantity, 100, "jami qoldiq o'zgarmasligi kerak");

    // Ikkala harakat ham hujjatga bog'langan bo'lishi kerak.
    const moves = await prisma.stockMove.findMany({
      where: { productId: f.productId, referenceType: "StockDocument", referenceId: doc.id },
      orderBy: { reason: "asc" },
    });
    assert.equal(moves.length, 2, "ikki ledger yozuvi (out + in) bo'lishi kerak");
    const reasons = moves.map((m) => m.reason).sort();
    assert.deepEqual(reasons, ["TRANSFER_IN", "TRANSFER_OUT"]);
  });

  test("yetarli bo'lmagan miqdor bilan ko'chirish rad etiladi va qisman o'tmaydi", async () => {
    await prisma.$transaction(async (tx) => {
      await recordStockChange(tx, {
        productId: f.productId,
        warehouseId: f.warehouseId,
        change: 10,
        reason: "RECEIPT",
      });
    });

    const doc = await createStockDocument(
      {
        type: "TRANSFER",
        warehouseId: f.warehouseId,
        destWarehouseId: f.secondWarehouseId,
        items: [{ productId: f.productId, quantity: 50 }],
      },
      f.employeeId
    );

    await assert.rejects(() => postStockDocument(doc.id, f.employeeId));

    // Butun tranzaksiya orqaga qaytirilgan bo'lishi kerak.
    const a = await readStock(f.productId, f.warehouseId);
    const b = await readStock(f.productId, f.secondWarehouseId);
    assert.equal(a.quantity, 10, "manba o'zgarmasligi kerak");
    assert.equal(b.quantity, 0, "manzilga qisman o'tish kerak emas");

    const moves = await prisma.stockMove.count({
      where: { productId: f.productId, referenceType: "StockDocument", referenceId: doc.id },
    });
    assert.equal(moves, 0, "muvaffaqiyatsiz tranzaksiyadan jurnal qolmasligi kerak");

    const status = await prisma.stockDocument.findUniqueOrThrow({ where: { id: doc.id } });
    assert.equal(status.status, "DRAFT", "hujjat DRAFT da qolishi kerak");
  });
});

describe("Test E — yetarli qoldiq yo'q (Insufficient stock)", { skip: !dbTestsEnabled }, () => {
  test("chiqim rad etiladi: qoldiq o'zgarmaydi, yozuv yaratilmaydi", async () => {
    await prisma.$transaction(async (tx) => {
      await recordStockChange(tx, {
        productId: f.productId,
        warehouseId: f.warehouseId,
        change: 5,
        reason: "RECEIPT",
      });
    });

    await assert.rejects(
      () =>
        prisma.$transaction(async (tx) =>
          recordStockChange(tx, {
            productId: f.productId,
            warehouseId: f.warehouseId,
            change: -10,
            reason: "ISSUE",
          })
        ),
      /yetarli qoldiq/
    );

    const stock = await readStock(f.productId, f.warehouseId);
    assert.equal(stock.quantity, 5, "qoldiq o'zgarmasligi kerak");
    assert.equal(stock.reserved, 0);

    const issueMoves = await prisma.stockMove.count({
      where: { productId: f.productId, reason: "ISSUE" },
    });
    assert.equal(issueMoves, 0, "muvaffaqiyatsiz chiqim jurnalda qolmasligi kerak");
  });

  test("chiqim hujjati yetarli qoldiq bo'lmasa rad etiladi", async () => {
    await prisma.$transaction(async (tx) => {
      await recordStockChange(tx, {
        productId: f.productId,
        warehouseId: f.warehouseId,
        change: 3,
        reason: "RECEIPT",
      });
    });

    const doc = await createStockDocument(
      {
        type: "ISSUE",
        warehouseId: f.warehouseId,
        items: [{ productId: f.productId, quantity: 10 }],
      },
      f.employeeId
    );

    await assert.rejects(() => postStockDocument(doc.id, f.employeeId));
    assert.equal((await readStock(f.productId, f.warehouseId)).quantity, 3);
  });
});

describe("Ombor invariantlari", { skip: !dbTestsEnabled }, () => {
  test("har bir qoldiq o'zgarishi ledgerda iz qoldiradi", async () => {
    await prisma.$transaction(async (tx) => {
      await recordStockChange(tx, {
        productId: f.productId,
        warehouseId: f.warehouseId,
        change: 7,
        reason: "RECEIPT",
      });
      await recordStockChange(tx, {
        productId: f.productId,
        warehouseId: f.warehouseId,
        change: -2,
        reason: "ISSUE",
      });
    });

    const moves = await prisma.stockMove.findMany({
      where: { productId: f.productId },
      orderBy: { createdAt: "asc" },
    });
    assert.equal(moves.length, 2);
    assert.equal(moves[0]!.stockAfter, 7);
    assert.equal(moves[1]!.stockAfter, 5);
  });

  test("baza darajasida: reserved > quantity rad etiladi", async () => {
    await prisma.$transaction(async (tx) => {
      await recordStockChange(tx, {
        productId: f.productId,
        warehouseId: f.warehouseId,
        change: 10,
        reason: "RECEIPT",
      });
    });

    const stock = await prisma.stock.findUniqueOrThrow({
      where: { productId_warehouseId: { productId: f.productId, warehouseId: f.warehouseId } },
    });
    await assert.rejects(
      () => prisma.stock.update({ where: { id: stock.id }, data: { reserved: 99 } }),
      /zaxira qoldiqdan oshishi/i
    );
  });

  test("baza darajasida: manfiy qoldiq rad etiladi", async () => {
    await prisma.$transaction(async (tx) => {
      await recordStockChange(tx, {
        productId: f.productId,
        warehouseId: f.warehouseId,
        change: 10,
        reason: "RECEIPT",
      });
    });

    const stock = await prisma.stock.findUniqueOrThrow({
      where: { productId_warehouseId: { productId: f.productId, warehouseId: f.warehouseId } },
    });
    await assert.rejects(
      () => prisma.stock.update({ where: { id: stock.id }, data: { quantity: -1 } }),
      /manfiy/i
    );
  });

  test("bekor qilingan (POSTED) hujjat teskari harakat yozadi, jim o'zgartirmaydi", async () => {
    const doc = await createStockDocument(
      {
        type: "RECEIPT",
        warehouseId: f.warehouseId,
        items: [{ productId: f.productId, quantity: 40 }],
      },
      f.employeeId
    );
    await postStockDocument(doc.id, f.employeeId);
    assert.equal((await readStock(f.productId, f.warehouseId)).quantity, 40);

    await cancelStockDocument(doc.id, f.employeeId);

    assert.equal((await readStock(f.productId, f.warehouseId)).quantity, 0, "teskari harakat qoldiqni tiklashi kerak");

    const moves = await prisma.stockMove.findMany({
      where: { referenceType: "StockDocument", referenceId: doc.id },
      orderBy: { createdAt: "asc" },
    });
    assert.equal(moves.length, 2, "kirim + teskari yozuv bo'lishi kerak");
    assert.equal(moves[1]!.change, -40);

    const status = await prisma.stockDocument.findUniqueOrThrow({ where: { id: doc.id } });
    assert.equal(status.status, "CANCELLED");
  });

  test("sarflangan kirimni bekor qilish rad etiladi (manfiy qoldiqga olib kelmasin)", async () => {
    const doc = await createStockDocument(
      {
        type: "RECEIPT",
        warehouseId: f.warehouseId,
        items: [{ productId: f.productId, quantity: 40 }],
      },
      f.employeeId
    );
    await postStockDocument(doc.id, f.employeeId);

    // 30 dona sarflanadi
    await prisma.$transaction(async (tx) => {
      await recordStockChange(tx, {
        productId: f.productId,
        warehouseId: f.warehouseId,
        change: -30,
        reason: "ISSUE",
      });
    });

    await assert.rejects(() => cancelStockDocument(doc.id, f.employeeId), /bekor qilib bo'lmaydi/);
    assert.equal((await readStock(f.productId, f.warehouseId)).quantity, 10, "qoldiq o'zgarmasligi kerak");
  });
});

describe("Konkurentsiya (Concurrency)", { skip: !dbTestsEnabled }, () => {
  test("parallel chiqimlar qoldiqni manfiyga tushirmaydi (lost update yo'q)", async () => {
    await prisma.$transaction(async (tx) => {
      await recordStockChange(tx, {
        productId: f.productId,
        warehouseId: f.warehouseId,
        change: 100,
        reason: "RECEIPT",
      });
    });

    // 10 ta parallel so'rov, har biri 15 dona chiqim qilmoqchi (jami 150 > 100).
    const results = await Promise.allSettled(
      Array.from({ length: 10 }, () =>
        prisma.$transaction(async (tx) =>
          recordStockChange(tx, {
            productId: f.productId,
            warehouseId: f.warehouseId,
            change: -15,
            reason: "ISSUE",
          })
        )
      )
    );

    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.length - succeeded;

    const stock = await readStock(f.productId, f.warehouseId);
    assert.ok(stock.quantity >= 0, "qoldiq manfiy bo'lmasligi kerak");
    assert.equal(
      stock.quantity,
      100 - succeeded * 15,
      `muvaffaqiyatli ${succeeded} ta chiqimdan keyingi qoldiq to'g'ri bo'lishi kerak`
    );
    assert.ok(failed > 0, "ortiqcha so'rovlar rad etilishi kerak");

    // Jurnal yozuvlari soni muvaffaqiyatli chiqimlar soniga teng.
    const moves = await prisma.stockMove.count({
      where: { productId: f.productId, reason: "ISSUE" },
    });
    assert.equal(moves, succeeded, "har bir muvaffaqiyatli chiqim uchun bitta yozuv bo'lishi kerak");
  });

  test("parallel zaxiralashlar mavjud qoldiqdan oshmasligi kerak", async () => {
    await prisma.$transaction(async (tx) => {
      await recordStockChange(tx, {
        productId: f.productId,
        warehouseId: f.warehouseId,
        change: 100,
        reason: "RECEIPT",
      });
    });

    const results = await Promise.allSettled(
      Array.from({ length: 10 }, () =>
        prisma.$transaction(async (tx) =>
          reserveStock(tx, {
            productId: f.productId,
            warehouseId: f.warehouseId,
            quantity: 30,
          })
        )
      )
    );

    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const stock = await readStock(f.productId, f.warehouseId);
    assert.equal(stock.reserved, succeeded * 30, "zaxira miqdori aniq bo'lishi kerak");
    assert.ok(stock.reserved <= stock.quantity, "zaxira qoldiqdan oshmasligi kerak");
    assert.ok(succeeded <= 3, "100 dona qoldiqda 30'lik zaxiradan ko'pi mumkin emas");
  });
});
