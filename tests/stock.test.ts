// Stock ledger tests against a LOCAL test database.
// Run: RUN_DB_TESTS=1 TEST_DATABASE_URL=postgresql://…@localhost:5432/stratega_test npm run test:db
import "./helpers/db";
import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { dbTestsEnabled } from "./helpers/db";

const T = `__test__${Date.now()}`;

describe("stock ledger", { skip: !dbTestsEnabled }, async () => {
  const { prisma } = await import("@/lib/prisma");
  const { moveStock, reserve, postStockDocument } = await import("@/lib/inventory");
  const { supplierReport } = await import("@/lib/analytics");
  let catId = "";
  let whA = "";
  let whB = "";
  let supId = "";

  const newProduct = async (n: string) =>
    (await prisma.product.create({ data: { name: `${T} ${n}`, slug: `${T}-${n}`.toLowerCase(), sku: `${T}-${n}`, categoryId: catId, price: 1000, isActive: false } })).id;
  const level = (productId: string, warehouseId: string) =>
    prisma.stockLevel.findUnique({ where: { productId_warehouseId: { productId, warehouseId } } });
  let docNo = 0;
  const doc = (type: "RECEIPT" | "ISSUE" | "TRANSFER" | "INVENTORY", productId: string, quantity: number, extra: { unitCost?: number; target?: string; supplierId?: string } = {}) =>
    prisma.stockDocument.create({
      data: {
        number: `${T}-D${++docNo}`,
        type,
        warehouseId: whA,
        targetWarehouseId: extra.target,
        supplierId: extra.supplierId,
        lines: { create: [{ productId, quantity, unitCost: extra.unitCost }] },
      },
    });

  before(async () => {
    catId = (await prisma.category.create({ data: { name: T, slug: T } })).id;
    whA = (await prisma.warehouse.create({ data: { name: `${T} A`, code: `${T}A` } })).id;
    whB = (await prisma.warehouse.create({ data: { name: `${T} B`, code: `${T}B` } })).id;
    supId = (await prisma.supplier.create({ data: { name: `${T} supplier` } })).id;
  });

  after(async () => {
    const products = await prisma.product.findMany({ where: { name: { startsWith: T } }, select: { id: true } });
    const ids = products.map((p) => p.id);
    await prisma.stockMove.deleteMany({ where: { productId: { in: ids } } });
    await prisma.stockDocument.deleteMany({ where: { number: { startsWith: T } } });
    await prisma.stockLevel.deleteMany({ where: { productId: { in: ids } } });
    await prisma.product.deleteMany({ where: { id: { in: ids } } });
    await prisma.supplier.deleteMany({ where: { name: { startsWith: T } } });
    await prisma.warehouse.deleteMany({ where: { name: { startsWith: T } } });
    await prisma.category.deleteMany({ where: { name: T } });
    await prisma.$disconnect();
  });

  test("receipt: stock, ledger, Product.stock and cost price are updated", async () => {
    const p = await newProduct("receipt");
    const d = await doc("RECEIPT", p, 100, { unitCost: 2500 });
    await prisma.$transaction((tx) => postStockDocument(tx, d.id, "test"));
    assert.equal((await level(p, whA))?.quantity, 100);
    const product = await prisma.product.findUniqueOrThrow({ where: { id: p } });
    assert.equal(product.stock, 100);
    assert.equal(product.costPrice, 2500);
    const moves = await prisma.stockMove.findMany({ where: { productId: p } });
    assert.equal(moves.length, 1);
    assert.equal(moves[0].balanceAfter, 100);
  });

  test("a posted document cannot be posted twice", async () => {
    const p = await newProduct("twice");
    const d = await doc("RECEIPT", p, 5);
    await prisma.$transaction((tx) => postStockDocument(tx, d.id, "test"));
    await assert.rejects(prisma.$transaction((tx) => postStockDocument(tx, d.id, "test")));
    assert.equal((await level(p, whA))?.quantity, 5);
  });

  test("issue larger than stock is rejected and changes nothing", async () => {
    const p = await newProduct("short");
    await prisma.$transaction((tx) => moveStock(tx, { productId: p, warehouseId: whA, delta: 3, reason: "OPENING" }));
    const d = await doc("ISSUE", p, 10);
    await assert.rejects(prisma.$transaction((tx) => postStockDocument(tx, d.id, "test")), /yetarli emas/);
    assert.equal((await level(p, whA))?.quantity, 3);
    assert.equal(await prisma.stockMove.count({ where: { productId: p } }), 1);
    assert.equal((await prisma.stockDocument.findUniqueOrThrow({ where: { id: d.id } })).status, "DRAFT");
  });

  test("transfer moves stock between warehouses, total unchanged", async () => {
    const p = await newProduct("transfer");
    await prisma.$transaction((tx) => moveStock(tx, { productId: p, warehouseId: whA, delta: 100, reason: "OPENING" }));
    const d = await doc("TRANSFER", p, 20, { target: whB });
    await prisma.$transaction((tx) => postStockDocument(tx, d.id, "test"));
    assert.equal((await level(p, whA))?.quantity, 80);
    assert.equal((await level(p, whB))?.quantity, 20);
    assert.equal((await prisma.product.findUniqueOrThrow({ where: { id: p } })).stock, 100);
  });

  test("inventory count writes the difference", async () => {
    const p = await newProduct("count");
    await prisma.$transaction((tx) => moveStock(tx, { productId: p, warehouseId: whA, delta: 50, reason: "OPENING" }));
    const d = await doc("INVENTORY", p, 47);
    await prisma.$transaction((tx) => postStockDocument(tx, d.id, "test"));
    assert.equal((await level(p, whA))?.quantity, 47);
    const last = await prisma.stockMove.findFirstOrThrow({ where: { productId: p, reason: "INVENTORY" } });
    assert.equal(last.delta, -3);
  });

  test("reservation cannot exceed stock; release never goes below zero", async () => {
    const p = await newProduct("reserve");
    await prisma.$transaction((tx) => moveStock(tx, { productId: p, warehouseId: whA, delta: 100, reason: "OPENING" }));
    await prisma.$transaction((tx) => reserve(tx, p, whA, 25));
    assert.equal((await level(p, whA))?.reserved, 25);
    await assert.rejects(prisma.$transaction((tx) => reserve(tx, p, whA, 80)), /yetarli emas/);
    assert.equal((await level(p, whA))?.reserved, 25);
    await prisma.$transaction((tx) => reserve(tx, p, whA, -40));
    assert.equal((await level(p, whA))?.reserved, 0);
  });

  test("parallel issues never push stock below zero (no lost updates)", async () => {
    const p = await newProduct("race");
    await prisma.$transaction((tx) => moveStock(tx, { productId: p, warehouseId: whA, delta: 100, reason: "OPENING" }));
    const results = await Promise.allSettled(
      Array.from({ length: 10 }, () => prisma.$transaction((tx) => moveStock(tx, { productId: p, warehouseId: whA, delta: -15, reason: "ISSUE" }))),
    );
    const ok = results.filter((r) => r.status === "fulfilled").length;
    assert.equal(ok, 6); // 6 × 15 = 90 ≤ 100; the 7th would go negative
    assert.equal((await level(p, whA))?.quantity, 10);
    const sum = await prisma.stockMove.aggregate({ where: { productId: p }, _sum: { delta: true } });
    assert.equal(sum._sum.delta, 10); // ledger matches the balance
  });

  test("parallel reservations never exceed stock", async () => {
    const p = await newProduct("race-reserve");
    await prisma.$transaction((tx) => moveStock(tx, { productId: p, warehouseId: whA, delta: 50, reason: "OPENING" }));
    const results = await Promise.allSettled(Array.from({ length: 8 }, () => prisma.$transaction((tx) => reserve(tx, p, whA, 10))));
    assert.equal(results.filter((r) => r.status === "fulfilled").length, 5);
    assert.equal((await level(p, whA))?.reserved, 50);
  });

  test("supplier report sums posted receipts at unit cost", async () => {
    const p = await newProduct("supplier");
    const d1 = await doc("RECEIPT", p, 10, { unitCost: 1000, supplierId: supId });
    const d2 = await doc("RECEIPT", p, 5, { unitCost: 4000, supplierId: supId });
    await prisma.$transaction((tx) => postStockDocument(tx, d1.id, "test"));
    await prisma.$transaction((tx) => postStockDocument(tx, d2.id, "test"));
    const row = (await supplierReport(0)).rows.find((r) => r.id === supId);
    assert.ok(row);
    assert.equal(row.posted, 2);
    assert.equal(row.units, 15);
    assert.equal(row.value, 30000);
    assert.equal(Math.round(row.avgUnitCost), 2000);
  });
});
