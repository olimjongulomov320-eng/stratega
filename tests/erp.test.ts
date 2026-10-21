import "dotenv/config";
import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "@/lib/prisma";
import { createQuotation, updateQuotationStatus, createOrderFromQuotation } from "@/lib/quotations";
import { createOrder, updateOrderStatus } from "@/lib/orders";
import { recordPayment, getOrderPaymentSummaryDetailed, getOrderTotal } from "@/lib/payments";
import { createShipmentFromOrder, postShipment, deliverShipment } from "@/lib/shipments";
import { convertRfqToOrder } from "@/lib/rfq-to-order";
import { roleHasPermission, getRolePermissions, PERMISSIONS } from "@/lib/permissions";
import { requireAdminPermission } from "@/lib/require-permission";
import { writeAuditLog } from "@/lib/audit";
import {
  getStockSummary,
  getRevenueReport,
  getTopProducts,
  getInventoryValue,
  getInventoryForecast,
  getLowStockProducts,
} from "@/lib/inventory-assistant";
import { applyStockImport, previewStockImport } from "@/lib/stock-import";
import { applyCustomersImport, previewCustomersImport } from "@/lib/customers-import";
import { refreshAlerts, getActiveAlerts } from "@/lib/alerts";
import { adjustStock } from "@/app/admin/(dashboard)/stock/actions";

// Ushbu fayl butun ERP oqimini HAQIQIY bazada tekshiradi:
// Taklif -> Buyurtma -> Zaxira -> Jo'natma -> To'lov, RFQ konversiyasi,
// ruxsatlar, tahlillar, CSV import, alerts va audit.
// Diqqat: `tsx` .env ni avtomatik yuklamaydi — birinchi import dotenv.

const TEST = "__test__erp__";

async function cleanup() {
  // FK zanjiri bo'yicha: to'lov -> jo'natma -> buyurtma -> taklif -> rfq.
  const customerScope = { customer: { companyName: { startsWith: TEST } } };
  await prisma.payment.deleteMany({ where: { order: customerScope } });
  await prisma.shipment.deleteMany({ where: { order: customerScope } });
  await prisma.order.deleteMany({ where: customerScope });
  await prisma.quotation.deleteMany({ where: customerScope });

  const rfqs = await prisma.rfqRequest.findMany({
    where: { companyName: { startsWith: TEST } },
    select: { id: true },
  });
  if (rfqs.length > 0) {
    const rfqIds = rfqs.map((r) => r.id);
    await prisma.rfqItem.deleteMany({ where: { requestId: { in: rfqIds } } });
    await prisma.rfqRequest.deleteMany({ where: { id: { in: rfqIds } } });
  }

  // Alert sarlavhasi mahsulot nomidan keladi (nomimiz TEST bilan boshlanadi).
  await prisma.alert.deleteMany({ where: { title: { startsWith: TEST } } });
  await prisma.auditLog.deleteMany({ where: { entityId: { startsWith: TEST } } });
  await prisma.priceHistory.deleteMany({ where: { product: { slug: { startsWith: TEST } } } });
  await prisma.stockMove.deleteMany({ where: { product: { slug: { startsWith: TEST } } } });
  await prisma.stock.deleteMany({ where: { product: { slug: { startsWith: TEST } } } });
  await prisma.stockDocumentItem.deleteMany({ where: { product: { slug: { startsWith: TEST } } } });
  await prisma.stockDocument.deleteMany({ where: { number: { startsWith: TEST } } });
  await prisma.product.deleteMany({ where: { slug: { startsWith: TEST } } });
  await prisma.customer.deleteMany({ where: { companyName: { startsWith: TEST } } });
  await prisma.warehouse.deleteMany({ where: { code: { startsWith: TEST.toUpperCase() } } });
}

before(async () => {
  await cleanup();
});

after(async () => {
  await cleanup();
});

// Yordamchi: test ombori + ixtiyoran qoldig'i bor mahsulot yaratadi.
async function makeProduct(
  slugSuffix: string,
  opts: { price?: number; cost?: number; stock?: number; warehouseId?: string } = {}
) {
  const warehouse =
    opts.warehouseId ??
    (
      await prisma.warehouse.create({
        data: {
          name: `${TEST}ombor-${slugSuffix}`,
          // Kesish (slice) cheklangan uzunlikda NOYOB bo'lmasligi mumkin —
          // kod o'zgartirilmaydi, to'liq saqlanadi.
          code: `${TEST.toUpperCase()}${slugSuffix.toUpperCase()}`,
        },
      })
    ).id;
  const product = await prisma.product.create({
    data: {
      slug: `${TEST}${slugSuffix}`,
      name: `${TEST}mahsulot-${slugSuffix}`,
      description: "ERP test mahsulot",
      price: opts.price ?? 100_000,
      costPrice: opts.cost ?? 60_000,
      stock: 0,
      category: {
        connectOrCreate: {
          where: { slug: `${TEST}cat` },
          create: { name: `${TEST}kategoriya`, slug: `${TEST}cat` },
        },
      },
    },
  });
  const stock = opts.stock ?? 0;
  if (stock > 0) {
    await prisma.stock.create({
      data: { productId: product.id, warehouseId: warehouse, quantity: stock, reserved: 0 },
    });
    await prisma.product.update({ where: { id: product.id }, data: { stock } });
  }
  return { product, warehouse };
}

describe("F. Savdo oqimi: Taklif -> Buyurtma -> Jo'natma -> To'lov", () => {
  test("Taklif yaratiladi, holatlar ketma-ketligi sakrab o'tmaydi", async () => {
    const { product, warehouse } = await makeProduct("quo1", { stock: 10 });
    const customer = await prisma.customer.create({
      data: { companyName: `${TEST}klient-quo`, contactName: "Test", phone: "+998901111111" },
    });

    const quotation = await createQuotation({
      customerId: customer.id,
      items: [{ productId: product.id, quantity: 2, price: 120_000 }],
    });
    assert.equal(quotation.status, "DRAFT");
    assert.match(quotation.number, /^QUO-/);

    // DRAFT'dan to'g'ridan-to'g'ri ACCEPTED bo'lmaydi.
    await assert.rejects(() => updateQuotationStatus(quotation.id, "ACCEPTED"));

    await updateQuotationStatus(quotation.id, "SENT");
    await updateQuotationStatus(quotation.id, "ACCEPTED");

    // Qabul qilingan taklifdan buyurtma; hali zaxira yo'q (DRAFT).
    const { orderId } = await createOrderFromQuotation(quotation.id);
    const order = await prisma.order.findUniqueOrThrow({
      where: { id: orderId },
      include: { items: true },
    });
    assert.equal(order.status, "DRAFT");
    assert.equal(order.items.length, 1);
    assert.equal(order.items[0].price, 120_000);
    assert.equal(order.items[0].costPrice, 60_000); // tannarx snapshotlandi
    assert.ok(order.warehouseId);

    const stockRow = await prisma.stock.findUnique({
      where: { productId_warehouseId: { productId: product.id, warehouseId: warehouse } },
    });
    assert.equal(stockRow!.reserved, 0);

    // Taklif allaqachon buyurtmaga bog'langan — qayta yaratilmaydi.
    const again = await createOrderFromQuotation(quotation.id);
    assert.equal(again.orderId, orderId);

    // DRAFT bekor qilinsa qoldiq joyida (zaxira qo'yilmagan edi).
    await updateOrderStatus(orderId, "CANCELLED");
    const afterCancel = await prisma.stock.findUnique({
      where: { productId_warehouseId: { productId: product.id, warehouseId: warehouse } },
    });
    assert.equal(afterCancel!.quantity, 10);
    assert.equal(afterCancel!.reserved, 0);
  });

  test("Buyurtma: tasdiqlash -> zaxira, jo'natma -> qoldiq kamayadi, to'lov -> PAID", async () => {
    const { product, warehouse } = await makeProduct("flow1", { price: 50_000, cost: 30_000, stock: 8 });
    const customer = await prisma.customer.create({
      data: { companyName: `${TEST}klient-flow`, contactName: "Test", phone: "+998902222222" },
    });

    const order = await createOrder(
      {
        customerId: customer.id,
        warehouseId: warehouse,
        items: [{ productId: product.id, quantity: 5, price: 50_000 }],
      },
      null
    );
    assert.equal(order.status, "DRAFT");

    // DRAFT'dan SHIPPED'ga sakrab bo'lmaydi.
    await assert.rejects(() => updateOrderStatus(order.id, "SHIPPED"));

    // Tasdiqlash: faqat zaxira, jismoniy qoldiq o'zgarmaydi.
    await updateOrderStatus(order.id, "CONFIRMED");
    let stockRow = await prisma.stock.findUnique({
      where: { productId_warehouseId: { productId: product.id, warehouseId: warehouse } },
    });
    assert.equal(stockRow!.quantity, 8);
    assert.equal(stockRow!.reserved, 5);

    // Jo'natma: zaxira yopiladi + jismoniy qoldiq kamayadi.
    await updateOrderStatus(order.id, "READY_TO_SHIP");
    const shipment = await createShipmentFromOrder(order.id);
    assert.equal(shipment.status, "DRAFT");
    await postShipment(shipment.id);
    await updateOrderStatus(order.id, "SHIPPED");

    stockRow = await prisma.stock.findUnique({
      where: { productId_warehouseId: { productId: product.id, warehouseId: warehouse } },
    });
    assert.equal(stockRow!.quantity, 3); // 8 - 5
    assert.equal(stockRow!.reserved, 0); // zaxira yopildi

    const posted = await prisma.shipment.findUniqueOrThrow({ where: { id: shipment.id } });
    assert.equal(posted.status, "SHIPPED");
    assert.ok(posted.stockAppliedAt, "jo'natma bir marta yozilganini bildiradi");

    // Qayta yozib bo'lmaydi (idempotent).
    await assert.rejects(() => postShipment(shipment.id));

    // To'lov: qisman -> PARTIAL, to'liq -> PAID.
    const total = await getOrderTotal(order.id);
    assert.equal(total, 5 * 50_000);

    await recordPayment(order.id, { amount: 100_000, method: "cash" });
    let summary = await getOrderPaymentSummaryDetailed(order.id);
    assert.equal(summary.status, "PARTIAL");
    assert.equal(summary.paid, 100_000);

    await recordPayment(order.id, { amount: total - 100_000, method: "card" });
    summary = await getOrderPaymentSummaryDetailed(order.id);
    assert.equal(summary.status, "PAID");
    assert.equal(summary.paid, total);
    assert.equal(summary.outstanding, 0);

    // Yetkazildi -> avtomatik COMPLETED (barcha qoldiq jo'natilgan).
    await deliverShipment(shipment.id);
    const final = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    assert.equal(final.status, "COMPLETED");

    // Audit: order.create yozuvi mavjud.
    const audit = await prisma.auditLog.findFirst({ where: { action: "order.create", entityId: order.id } });
    assert.ok(audit, "order.create audit yozuvi bo'lishi kerak");
  });

  test("Buyurtma bekor qilinsa zaxira to'liq bo'shatiladi", async () => {
    const { product, warehouse } = await makeProduct("cancel1", { stock: 4 });
    const customer = await prisma.customer.create({
      data: { companyName: `${TEST}klient-cancel`, contactName: "Test", phone: "+998903333333" },
    });
    const order = await createOrder(
      {
        customerId: customer.id,
        warehouseId: warehouse,
        items: [{ productId: product.id, quantity: 3, price: 10_000 }],
      },
      null
    );
    await updateOrderStatus(order.id, "CONFIRMED");
    let stockRow = await prisma.stock.findUnique({
      where: { productId_warehouseId: { productId: product.id, warehouseId: warehouse } },
    });
    assert.equal(stockRow!.reserved, 3);

    await updateOrderStatus(order.id, "CANCELLED");
    stockRow = await prisma.stock.findUnique({
      where: { productId_warehouseId: { productId: product.id, warehouseId: warehouse } },
    });
    assert.equal(stockRow!.reserved, 0);
    assert.equal(stockRow!.quantity, 4); // jismoniy qoldiq o'zgarmadi

    // Bekor qilingan buyurtmani qayta o'zgartirib bo'lmaydi.
    await assert.rejects(() => updateOrderStatus(order.id, "CONFIRMED"));
  });

  test("RFQ -> Buyurtma konversiyasi: qoldiq ikki marta kamaymaydi", async () => {
    const { product, warehouse } = await makeProduct("rfq1", { stock: 20 });
    // RFQ CONFIRMED holatida — requests/actions.ts allaqachon qoldiqni
    // kamaytirgan deb faraz qilamiz (3 dona).
    await prisma.stock.update({
      where: { productId_warehouseId: { productId: product.id, warehouseId: warehouse } },
      data: { quantity: 17 },
    });
    await prisma.product.update({ where: { id: product.id }, data: { stock: 17 } });

    const rfq = await prisma.rfqRequest.create({
      data: {
        companyName: `${TEST}rfq-kompaniya`,
        contactName: "Test RFQ",
        phone: "+998904444444",
        requestType: "Aniq mahsulot",
        status: "CONFIRMED",
        items: { create: [{ productId: product.id, quantity: 3, priceAtQuote: 100_000 }] },
      },
    });

    const order = await convertRfqToOrder(rfq.id);
    assert.equal(order.status, "SHIPPED"); // allaqachon kamaygan

    // Qoldiq G'A YOQ o'zgarmadi (qayta kamaymadi).
    const stockRow = await prisma.stock.findUnique({
      where: { productId_warehouseId: { productId: product.id, warehouseId: warehouse } },
    });
    assert.equal(stockRow!.quantity, 17);

    // Haqiqiy jo'natma yaratilgan va yozilgan.
    const shipment = await prisma.shipment.findFirst({ where: { orderId: order.id } });
    assert.ok(shipment, "RFQ konversiyasi jo'natma yaratishi kerak");
    assert.equal(shipment!.status, "SHIPPED");
    assert.ok(shipment!.stockAppliedAt);

    // Ikki marta konvertsia qilinmaydi.
    await assert.rejects(() => convertRfqToOrder(rfq.id));

    // Customer avtomatik yaratilgan.
    const customer = await prisma.customer.findFirst({
      where: { companyName: `${TEST}rfq-kompaniya` },
    });
    assert.ok(customer);
    assert.equal(order.customerId, customer!.id);
  });
});

describe("G. Ruxsatlar (permissions)", () => {
  test("Rol matritsasi: OWNER hamma narsaga ega, VIEWER hech qayerga yozolmaydi", () => {
    const owner = getRolePermissions("OWNER");
    assert.equal(owner.length, PERMISSIONS.length);
    for (const p of PERMISSIONS) assert.ok(roleHasPermission("OWNER", p), `OWNER should have ${p}`);

    assert.ok(roleHasPermission("MANAGER", "orders.write"));
    assert.ok(!roleHasPermission("MANAGER", "users.manage"));
    assert.ok(!roleHasPermission("WAREHOUSE", "products.write"));
    assert.ok(roleHasPermission("WAREHOUSE", "stock.write"));
    assert.ok(!roleHasPermission("ACCOUNTANT", "stock.write"));
    assert.ok(roleHasPermission("ACCOUNTANT", "finance.write"));
    assert.ok(!roleHasPermission("VIEWER", "products.write"));
    assert.ok(!roleHasPermission("VIEWER", "orders.write"));
    assert.ok(roleHasPermission("VIEWER", "products.read"));
  });

  test("Sessiyasiz requireAdminPermission va adjustStock rad etadi", async () => {
    // Cookie konteksti yo'q — server-side himoya throw tashlaydi,
    // ya'ni harakat davom etmaydi (rad etilgan).
    await assert.rejects(() => requireAdminPermission("products.write"));
    await assert.rejects(() => adjustStock("any-product", 5, null));
  });
});

describe("H. CSV import: ombor guruhlash, priceHistory va audit", () => {
  test("Noto'g'ri sarlavha rad etiladi", async () => {
    const preview = await previewStockImport("name,price\nfoo,100\n");
    assert.ok(preview.error);
  });

  test("CSV qoldiqni TANLANGAN omborga yozadi, narx o'zgarishi PriceHistory yozadi", async () => {
    const { product, warehouse } = await makeProduct("csv1", { price: 20_000, stock: 2 });
    const second = await prisma.warehouse.create({
      data: { name: `${TEST}ombor-ikkinchi`, code: `${TEST.toUpperCase()}IKKINCHI` },
    });

    // ombor_kod ustuni orqali ikkinchi omborga 7 dona + narx o'zgarishi.
    const csv = `slug,narx,ombordagi_soni,ombor_kod\n${product.slug},25000,7,${second.code}\n`;
    const result = await applyStockImport(csv);
    assert.equal(result.error, undefined);
    assert.equal(result.updated.length, 1);
    assert.equal(result.skipped.length, 0);

    // Ikkinchi ombor: 7 dona; birinchi ombor o'zgarmadi.
    const secondStock = await prisma.stock.findUnique({
      where: { productId_warehouseId: { productId: product.id, warehouseId: second.id } },
    });
    assert.equal(secondStock!.quantity, 7);
    const firstStock = await prisma.stock.findUnique({
      where: { productId_warehouseId: { productId: product.id, warehouseId: warehouse } },
    });
    assert.equal(firstStock!.quantity, 2);

    // Product.stock — jami (denormalized).
    const updated = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
    assert.equal(updated.stock, 9);
    assert.equal(updated.price, 25_000);

    // PriceHistory yozildi.
    const ph = await prisma.priceHistory.findFirst({ where: { productId: product.id } });
    assert.ok(ph, "narx o'zgarganda PriceHistory yozilishi kerak");
    assert.equal(ph!.oldPrice, 20_000);
    assert.equal(ph!.newPrice, 25_000);
    assert.equal(ph!.changedBy, "csv-import");

    // Import jurnali (yagona yozuv).
    const audit = await prisma.auditLog.findFirst({ where: { action: "import.products" } });
    assert.ok(audit, "CSV import audit yozuvi bo'lishi kerak");
  });

  test("CSV band qilingan qoldiqdan pastga tushirishni rad etadi", async () => {
    const { product, warehouse } = await makeProduct("csv2", { stock: 5 });
    // 4 dona zaxiraga qo'yamiz.
    await prisma.stock.update({
      where: { productId_warehouseId: { productId: product.id, warehouseId: warehouse } },
      data: { reserved: 4 },
    });

    // 3 ga tushirishga urinish — 3 < reserved(4) -> skip.
    // ombor_kod shart: ustun bo'lmasa import ASOSIY omborga yo'nalgan
    // bo'lardi (u yerda bu mahsulotning qoldig'i yo'q).
    const csv = `slug,narx,ombordagi_soni,ombor_kod\n${product.slug},,3,${TEST.toUpperCase()}CSV2\n`;
    const preview = await previewStockImport(csv);
    const row = preview.rows.find((r) => r.slug === product.slug);
    assert.equal(row?.action, "skip");
    assert.match(row?.reason ?? "", /band qilingan/);

    // Hech narsa o'zgarmadi.
    const stockRow = await prisma.stock.findUnique({
      where: { productId_warehouseId: { productId: product.id, warehouseId: warehouse } },
    });
    assert.equal(stockRow!.quantity, 5);
    assert.equal(stockRow!.reserved, 4);
  });

  test("Mijozlar CSV: yangi qator yaratiladi, mavjud qator yangilanadi, yaroqsiz limit skip", async () => {
    const csv = [
      "kompaniya,aloqa,telefon,email,inn,kredit_limiti",
      `${TEST}csv-klient,Aliya,+998905555555,aliya@test.uz,3000000,500000`,
      `${TEST}csv-klient2,Bek,+998906666666,bek@test.uz,3000001,notanumber`,
    ].join("\n");

    const preview = await previewCustomersImport(csv);
    assert.equal(preview.error, undefined);
    assert.equal(preview.toCreate, 1);
    assert.equal(preview.toSkip, 1); // yaroqsiz kredit limiti

    const result = await applyCustomersImport(csv);
    assert.equal(result.created.length, 1);
    assert.equal(result.skipped.length, 1);

    const c1 = await prisma.customer.findFirst({ where: { companyName: `${TEST}csv-klient` } });
    assert.equal(c1!.contactName, "Aliya");
    assert.equal(c1!.creditLimit, 500_000);

    // Yangilanish: aloqa o'zgaradi, bo'sh ustun eski qiymatni saqlaydi.
    const updateCsv = [
      "kompaniya,aloqa,telefon,email,inn,kredit_limiti",
      `${TEST}csv-klient,Aliyaxon,+998905555555,aliya@test.uz,3000000,`,
    ].join("\n");
    const upd = await applyCustomersImport(updateCsv);
    assert.equal(upd.updated.length, 1);
    const c1b = await prisma.customer.findFirstOrThrow({
      where: { companyName: `${TEST}csv-klient` },
    });
    assert.equal(c1b.contactName, "Aliyaxon");
    assert.equal(c1b.creditLimit, 500_000);

    // Audit.
    const audit = await prisma.auditLog.findFirst({ where: { action: "import.customers" } });
    assert.ok(audit, "import.customers audit yozuvi bo'lishi kerak");
  });
});

describe("I. Tahlillar (analytics) haqiqiy raqamlar bilan", () => {
  test("getRevenueReport: faqat savdo holatidagi buyurtmalar, aniq summalar", async () => {
    const { product, warehouse } = await makeProduct("rev1", { price: 40_000, cost: 25_000, stock: 10 });
    const customer = await prisma.customer.create({
      data: { companyName: `${TEST}klient-rev`, contactName: "Test", phone: "+998907777777" },
    });

    const order = await createOrder(
      {
        customerId: customer.id,
        warehouseId: warehouse,
        items: [{ productId: product.id, quantity: 4, price: 40_000 }],
      },
      null
    );
    await updateOrderStatus(order.id, "CONFIRMED");
    await updateOrderStatus(order.id, "READY_TO_SHIP");
    const shipment = await createShipmentFromOrder(order.id);
    await postShipment(shipment.id);
    await updateOrderStatus(order.id, "SHIPPED");
    await updateOrderStatus(order.id, "COMPLETED");

    // Boshqa buyurtma: DRAFT — hisobga kirmaydi.
    const draftOrder = await createOrder(
      {
        customerId: customer.id,
        warehouseId: warehouse,
        items: [{ productId: product.id, quantity: 2, price: 40_000 }],
      },
      null
    );

    const report = await getRevenueReport({ customerId: customer.id });
    assert.equal(report.revenue, 4 * 40_000);
    assert.equal(report.cogs, 4 * 25_000);
    assert.equal(report.grossProfit, 4 * (40_000 - 25_000));
    assert.equal(report.orderCount, 1);
    assert.equal(report.averageOrderValue, 4 * 40_000);
    assert.equal(report.marginPercent, 37.5);

    // DRAFT bekor qilinsa ham hisob o'zgarmaydi (ya'ni CANCELLED ham chetlab o'tiladi).
    await updateOrderStatus(draftOrder.id, "CANCELLED");
    const after = await getRevenueReport({ customerId: customer.id });
    assert.equal(after.orderCount, 1);
    assert.equal(after.revenue, 4 * 40_000);
  });

  test("getInventoryValue: tannarx bo'yicha — qo'shilgan qoldiq aniq qo'shiladi", async () => {
    const before = await getInventoryValue();
    const { product } = await makeProduct("val1", { price: 500_000, cost: 120_000, stock: 6 });
    const after = await getInventoryValue();

    // 6 dona * 120_000 tannarx = 720_000; sotuv narxi 6 * 500_000 = 3_000_000.
    assert.equal(after.totalValue - before.totalValue, 6 * 120_000);
    assert.equal(after.totalRetailValue - before.totalRetailValue, 6 * 500_000);
    assert.equal(after.totalUnits - before.totalUnits, 6);

    const p = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
    assert.equal(p.stock, 6);
  });

  test("getStockSummary: qoldiq va band raqamlari bilan mos", async () => {
    const before = await getStockSummary();
    const { product, warehouse } = await makeProduct("sum1", { stock: 9 });
    await prisma.stock.update({
      where: { productId_warehouseId: { productId: product.id, warehouseId: warehouse } },
      data: { reserved: 3 },
    });
    const after = await getStockSummary();
    assert.equal(after.totalUnits - before.totalUnits, 9);
    assert.equal(after.reservedUnits - before.reservedUnits, 3);
    assert.ok(after.productCount > before.productCount);
  });

  test("getInventoryForecast: nofaol lekin qoldigi bor mahsulot ham ro'yxatda", async () => {
    const { product } = await makeProduct("fc1", { stock: 4 });
    // Tizim qoldiq tugagach avtomatik nofaol qiladi — bu yerda qoldiq bor,
    // lekin qo'lda o'chiramiz: faollik yo'qolgan mahsulot prognozda bo'lishi kerak.
    await prisma.product.update({ where: { id: product.id }, data: { isActive: false } });

    const forecast = await getInventoryForecast();
    const mine = forecast.find((f) => f.productId === product.id);
    assert.ok(mine, "nofaol lekin qoldigi bor mahsulot prognozda bo'lishi kerak");
    assert.equal(mine!.currentStock, 4);
  });

  test("getLowStockProducts: qoldiq=1 mahsulot pastki chegara ro'yxatida", async () => {
    const { product, warehouse } = await makeProduct("low1", { stock: 5 });
    await prisma.stock.update({
      where: { productId_warehouseId: { productId: product.id, warehouseId: warehouse } },
      data: { quantity: 1 },
    });
    const low = await getLowStockProducts();
    const mine = low.find((l) => l.id === product.id);
    assert.ok(mine, "qoldiq=1 mahsulot pastki chegara ro'yxatida bo'lishi kerak");
    assert.equal(mine!.stock, 1);
    assert.ok(mine!.minimumStock >= 1);
  });

  test("getTopProducts: savdo bo'yicha saralanadi va raqamlar to'g'ri", async () => {
    const { product, warehouse } = await makeProduct("top1", { price: 80_000, cost: 50_000, stock: 10 });
    const customer = await prisma.customer.create({
      data: { companyName: `${TEST}klient-top`, contactName: "Test", phone: "+998908888888" },
    });
    const order = await createOrder(
      {
        customerId: customer.id,
        warehouseId: warehouse,
        items: [{ productId: product.id, quantity: 6, price: 80_000 }],
      },
      null
    );
    await updateOrderStatus(order.id, "CONFIRMED");
    await updateOrderStatus(order.id, "READY_TO_SHIP");
    const shipment = await createShipmentFromOrder(order.id);
    await postShipment(shipment.id);
    await updateOrderStatus(order.id, "SHIPPED");
    await updateOrderStatus(order.id, "COMPLETED");

    const top = await getTopProducts(1000);
    const mine = top.find((t) => t.productId === product.id);
    assert.ok(mine, "savdo qilgan mahsulot top ro'yxatida");
    assert.equal(mine!.revenue, 6 * 80_000);
    assert.equal(mine!.unitsSold, 6);
  });
});

describe("A. Buyurtma validatsiyasi", () => {
  test("Noto'g'ri miqdor/narx/takroriy mahsulot rad etiladi", async () => {
    const { product } = await makeProduct("val2", { stock: 1 });
    await assert.rejects(() => createOrder({ items: [] }, null), /kamida bitta/);
    await assert.rejects(
      () => createOrder({ items: [{ productId: product.id, quantity: 0, price: 100 }] }, null),
      /musbat butun son/
    );
    await assert.rejects(
      () => createOrder({ items: [{ productId: product.id, quantity: 1.5, price: 100 }] }, null),
      /musbat butun son/
    );
    await assert.rejects(
      () => createOrder({ items: [{ productId: product.id, quantity: 1, price: -5 }] }, null),
      /narxi noto'g'ri/
    );
    await assert.rejects(
      () =>
        createOrder(
          {
            items: [
              { productId: product.id, quantity: 1, price: 100 },
              { productId: product.id, quantity: 2, price: 100 },
            ],
          },
          null
        ),
      /bir necha marta/
    );
  });
});

describe("K. Alerts: haqiqiy qoldiq bo'yicha", () => {
  test("Tugagan mahsulot uchun OUT_OF_STOCK ogohlantirishi paydo bo'ladi", async () => {
    const { product } = await makeProduct("alert1", { stock: 0 });
    await refreshAlerts();
    const alert = await prisma.alert.findFirst({
      where: { type: "OUT_OF_STOCK", entityId: product.id, resolvedAt: null },
    });
    assert.ok(alert, "qoldiq=0 mahsulot uchun OUT_OF_STOCK bo'lishi kerak");
    assert.ok(alert!.title.startsWith(TEST));
  });

  test("getActiveAlerts endi yozmaydi (faqat o'qish)", async () => {
    const before = await prisma.alert.count();
    await getActiveAlerts(5);
    const after = await prisma.alert.count();
    assert.equal(after, before, "getActiveAlerts yangi yozuv qo'shmasligi kerak");
  });
});

describe("L. Audit tizimi", () => {
  test("writeAuditLog yozadi, JSON maydonlar saqlanadi", async () => {
    await writeAuditLog({
      actorId: null,
      actorLabel: "test",
      action: "test.action",
      entity: "Product",
      entityId: `${TEST}audit-entity`,
      oldData: { a: 1 },
      newData: { b: 2 },
    });
    const row = await prisma.auditLog.findFirst({ where: { entityId: `${TEST}audit-entity` } });
    assert.ok(row);
    assert.equal(row!.action, "test.action");
    assert.deepEqual(row!.oldData, { a: 1 });
    assert.deepEqual(row!.newData, { b: 2 });
  });
});
