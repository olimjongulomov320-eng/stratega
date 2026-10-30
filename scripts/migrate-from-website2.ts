/**
 * One-time data move: "Website 2" (the site now live on stratega.uz) → stratega-v2.
 *
 *   SOURCE_DATABASE_URL = Website 2 database (only read, never changed)
 *   DATABASE_URL        = the NEW, empty stratega-v2 database (migrations applied)
 *
 *   npx tsx --conditions=react-server scripts/migrate-from-website2.ts            # dry run: counts + warnings, writes nothing
 *   npx tsx --conditions=react-server scripts/migrate-from-website2.ts --apply    # copy everything in one transaction
 *
 * IDs are kept, so every link (order → customer, move → document…) survives.
 * Not copied on purpose: the generated "demo" reviews, ratings and sold counts
 * (they were invented), OTP codes, and alerts (recalculated by stratega-v2).
 */
import { Client } from "pg";
import type { Prisma } from "@/generated/prisma/client";

const APPLY = process.argv.includes("--apply");
const SOURCE = process.env.SOURCE_DATABASE_URL;
const TARGET = process.env.DATABASE_URL;

type Row = Record<string, unknown>;
const warnings: string[] = [];
const warn = (m: string) => warnings.push(m);

const s = (v: unknown) => (v === null || v === undefined ? null : String(v));
const n = (v: unknown) => (v === null || v === undefined ? null : Number(v));
const d = (v: unknown) => (v ? new Date(v as string) : null);

const MOVE_REASON: Record<string, string> = {
  MANUAL: "ADJUSTMENT",
  IMPORT: "CSV_IMPORT",
  ORDER: "SHIPMENT",
  RECEIPT: "RECEIPT",
  ISSUE: "ISSUE",
  RETURN: "RETURN",
  TRANSFER_IN: "TRANSFER_IN",
  TRANSFER_OUT: "TRANSFER_OUT",
  WRITE_OFF: "WRITE_OFF",
  INVENTORY_ADJUSTMENT: "INVENTORY",
};
const ORDER_STATUS: Record<string, string> = {
  DRAFT: "DRAFT",
  CONFIRMED: "CONFIRMED",
  PROCESSING: "CONFIRMED",
  READY_TO_SHIP: "CONFIRMED",
  SHIPPED: "SHIPPED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
};
function paymentMethod(m: unknown): "CASH" | "BANK_TRANSFER" | "CARD" | "OTHER" {
  const v = String(m ?? "").toLowerCase();
  if (/naqd|cash|нал/.test(v)) return "CASH";
  if (/bank|o.tkazma|transfer|перечис|безнал/.test(v)) return "BANK_TRANSFER";
  if (/karta|card|карт|uzcard|humo|click|payme/.test(v)) return "CARD";
  return "OTHER";
}
function settingValue(v: string): Prisma.InputJsonValue {
  if (v === "true" || v === "false") return v === "true";
  if (v.trim() !== "" && Number.isFinite(Number(v))) return Number(v);
  return v;
}

async function main() {
  if (!SOURCE || !TARGET) throw new Error("SOURCE_DATABASE_URL va DATABASE_URL kerak.");
  if (SOURCE === TARGET) throw new Error("Manba va nishon bir xil baza — to'xtatildi.");

  const src = new Client({ connectionString: SOURCE });
  await src.connect();
  // Read-only session: the old database can't be changed by this script, even by mistake.
  await src.query("SET SESSION CHARACTERISTICS AS TRANSACTION READ ONLY");
  const all = async (table: string, order = `"id"`): Promise<Row[]> => (await src.query(`SELECT * FROM "${table}" ORDER BY ${order}`)).rows;
  const has = async (table: string) => (await src.query(`SELECT to_regclass($1) AS t`, [`"${table}"`])).rows[0].t !== null;

  if (!(await has("Product"))) throw new Error("Manba bazada Product jadvali yo'q — bu Website 2 bazasimi?");
  // One connection, so tables are read one after another.
  const categories = await all("Category");
  const products = await all("Product");
  const priceHistory = await all("PriceHistory");
  const warehouses = await all("Warehouse", `"createdAt"`);
  const stocks = await all("Stock");
  const moves = await all("StockMove", `"createdAt", "id"`);
  const documents = await all("StockDocument");
  const docItems = await all("StockDocumentItem");
  const suppliers = await all("Supplier");
  const supplierProducts = await all("SupplierProduct");
  const priceLists = await all("PriceList");
  const priceListItems = await all("PriceListItem");
  const customers = await all("Customer");
  const employees = await all("Employee");
  const audit = await all("AuditLog", `"createdAt"`);
  const settings = await all("Setting", `"key"`);
  const users = await all("User");
  const sessions = await all("Session");
  const rfqs = await all("RfqRequest");
  const rfqItems = await all("RfqItem");
  const quotations = await all("Quotation");
  const quoteItems = await all("QuotationItem");
  const orders = await all("Order");
  const orderItems = await all("OrderItem");
  const shipments = await all("Shipment");
  const shipmentItems = await all("ShipmentItem");
  const payments = await all("Payment");

  const empName = new Map(employees.map((e) => [s(e.id)!, s(e.name)!]));

  // ── Warehouses: exactly one default; create one if Website 2 had none.
  let defaultWh = s(warehouses.find((w) => String(w.code).toUpperCase() === "MAIN")?.id) ?? s(warehouses[0]?.id);
  const whData: Prisma.WarehouseCreateManyInput[] = warehouses.map((w) => ({
    id: s(w.id)!, name: s(w.name)!, code: s(w.code)!, address: s(w.address), note: s(w.description), isActive: Boolean(w.isActive),
    isDefault: s(w.id) === defaultWh, createdAt: d(w.createdAt)!, updatedAt: d(w.updatedAt)!,
  }));
  if (!defaultWh) {
    defaultWh = "wh_main_migrated";
    whData.push({ id: defaultWh, name: "Asosiy ombor", code: "MAIN", isDefault: true });
    warn("Website 2 da ombor yo'q edi — «Asosiy ombor» yaratildi.");
  }

  const productIds = new Set(products.map((p) => s(p.id)!));
  const docIds = new Set(documents.map((x) => s(x.id)!));
  const shipmentIds = new Set(shipments.map((x) => s(x.id)!));

  // ── Products (fake rating / reviewCount / soldCount are dropped).
  const levelSum = new Map<string, number>();
  for (const st of stocks) levelSum.set(s(st.productId)!, (levelSum.get(s(st.productId)!) ?? 0) + Number(st.quantity));
  const productData: Prisma.ProductCreateManyInput[] = products.map((p) => ({
    id: s(p.id)!, slug: s(p.slug)!, name: s(p.name)!, nameRu: s(p.nameRu), nameEn: s(p.nameEn),
    description: s(p.description) ?? "", descriptionRu: s(p.descriptionRu), descriptionEn: s(p.descriptionEn),
    sku: s(p.sku), barcode: s(p.barcode), unit: (s(p.unit) ?? "PIECE") as Prisma.ProductCreateManyInput["unit"],
    price: Number(p.price), oldPrice: n(p.oldPrice), costPrice: n(p.costPrice), imageUrl: s(p.imageUrl),
    stock: levelSum.get(s(p.id)!) ?? 0, minimumStock: Number(p.minimumStock ?? 0), reorderPoint: n(p.reorderPoint),
    reorderQuantity: n(p.reorderQuantity), weightKg: n(p.weightKg), isActive: Boolean(p.isActive), isFeatured: Boolean(p.isFeatured),
    categoryId: s(p.categoryId)!, createdAt: d(p.createdAt)!, updatedAt: d(p.updatedAt)!,
  }));
  const faked = products.filter((p) => Number(p.reviewCount) > 0 || Number(p.soldCount) > 0).length;
  if (faked) warn(`${faked} ta mahsulotdagi soxta reyting / sharh soni / "sotildi" soni ko'chirilmadi (stratega-v2 faqat haqiqiy, tasdiqlangan sharhlarni ko'rsatadi).`);
  const mismatch = products.filter((p) => Number(p.stock) !== (levelSum.get(s(p.id)!) ?? 0)).length;
  if (mismatch) warn(`${mismatch} ta mahsulotda Product.stock ombor qoldiqlari yig'indisiga teng emas edi — yig'indi (Stock jadvali) asos qilib olindi.`);

  // ── Stock ledger. Zero changes are skipped (stratega-v2 forbids them).
  const moveData: Prisma.StockMoveCreateManyInput[] = [];
  let zeroMoves = 0;
  for (const m of moves) {
    if (Number(m.change) === 0) { zeroMoves++; continue; }
    const refType = s(m.referenceType);
    const refId = s(m.referenceId);
    moveData.push({
      id: s(m.id)!, productId: s(m.productId)!, warehouseId: s(m.warehouseId) ?? defaultWh!, delta: Number(m.change), balanceAfter: Number(m.stockAfter),
      reason: (MOVE_REASON[String(m.reason)] ?? "ADJUSTMENT") as Prisma.StockMoveCreateManyInput["reason"],
      note: [s(m.note), refType && refType !== "StockDocument" && refType !== "Shipment" ? `${refType} ${refId ?? ""}`.trim() : null].filter(Boolean).join(" · ") || null,
      documentId: refType === "StockDocument" && refId && docIds.has(refId) ? refId : null,
      shipmentId: refType === "Shipment" && refId && shipmentIds.has(refId) ? refId : null,
      actor: empName.get(s(m.createdBy) ?? "") ?? s(m.createdBy), createdAt: d(m.createdAt)!,
    });
  }
  if (zeroMoves) warn(`${zeroMoves} ta nol o'zgarishli ombor harakati o'tkazib yuborildi.`);
  const noWhMoves = moves.filter((m) => !m.warehouseId).length;
  if (noWhMoves) warn(`${noWhMoves} ta ombor harakatida ombor ko'rsatilmagan edi — asosiy omborga yozildi.`);

  // ── Price lists: Website 2 had a "kind", stratega-v2 needs a unique code.
  const usedCodes = new Set<string>();
  const plData: Prisma.PriceListCreateManyInput[] = priceLists.map((pl) => {
    let code = String(pl.kind ?? "custom").toLowerCase();
    for (let i = 2; usedCodes.has(code); i++) code = `${String(pl.kind).toLowerCase()}-${i}`;
    usedCodes.add(code);
    return { id: s(pl.id)!, name: s(pl.name)!, code, note: pl.isDefault ? "Website 2 da asosiy narxlar ro'yxati edi" : null, createdAt: d(pl.createdAt)!, updatedAt: d(pl.updatedAt)! };
  });

  // ── Orders: totals and payment state are recomputed from lines and payments.
  const orderTotal = new Map<string, number>();
  for (const i of orderItems) orderTotal.set(s(i.orderId)!, (orderTotal.get(s(i.orderId)!) ?? 0) + Number(i.price) * Number(i.quantity));
  const paid = new Map<string, number>();
  const refunded = new Map<string, number>();
  // Website 2 marked the original payment REFUNDED; stratega-v2 keeps the payment
  // and adds a separate refund row. So a refunded payment counts as paid AND refunded.
  for (const p of payments) {
    paid.set(s(p.orderId)!, (paid.get(s(p.orderId)!) ?? 0) + Number(p.amount));
    if (String(p.status) === "REFUNDED") refunded.set(s(p.orderId)!, (refunded.get(s(p.orderId)!) ?? 0) + Number(p.amount));
  }
  const orderWh = new Map<string, string>();
  const orderData: Prisma.OrderCreateManyInput[] = orders.map((o) => {
    const id = s(o.id)!;
    const total = orderTotal.get(id) ?? 0;
    const p = paid.get(id) ?? 0;
    const r = refunded.get(id) ?? 0;
    const net = p - r;
    const paymentStatus = r > 0 && net <= 0 ? "REFUNDED" : net <= 0 ? "UNPAID" : net >= total ? "PAID" : "PARTIAL";
    const status = ORDER_STATUS[String(o.status)] ?? "DRAFT";
    const wh = s(o.warehouseId) ?? defaultWh!;
    orderWh.set(id, wh);
    return {
      id, number: s(o.number)!, customerId: s(o.customerId), warehouseId: wh, quotationId: s(o.quotationId),
      status: status as Prisma.OrderCreateManyInput["status"], paymentStatus, total, paidAmount: net, note: s(o.note),
      confirmedAt: d(o.stockReservedAt) ?? (status !== "DRAFT" ? d(o.createdAt) : null), createdAt: d(o.createdAt)!, updatedAt: d(o.updatedAt)!,
    };
  });
  const squashed = orders.filter((o) => o.status === "PROCESSING" || o.status === "READY_TO_SHIP").length;
  if (squashed) warn(`${squashed} ta buyurtma "PROCESSING/READY_TO_SHIP" holatida edi — stratega-v2 da "Tasdiqlangan" bo'ladi.`);

  const quoteTotal = new Map<string, number>();
  for (const i of quoteItems) quoteTotal.set(s(i.quotationId)!, (quoteTotal.get(s(i.quotationId)!) ?? 0) + Number(i.price) * Number(i.quantity));

  // ── Employees: same scrypt scheme, stratega-v2 just prefixes "scrypt:".
  const employeeData: Prisma.EmployeeCreateManyInput[] = [];
  const seenEmail = new Set<string>();
  for (const e of employees) {
    let email = s(e.email)?.trim().toLowerCase() ?? "";
    if (!email || seenEmail.has(email)) {
      email = `xodim-${s(e.id)}@stratega.local`;
      warn(`Xodim «${s(e.name)}» da email yo'q edi — vaqtinchalik ${email} qo'yildi. Admin panelda haqiqiy email kiriting, aks holda u kira olmaydi.`);
    }
    seenEmail.add(email);
    const hash = s(e.passwordHash) ?? "";
    const passwordHash = /^[0-9a-f]+:[0-9a-f]+$/i.test(hash) ? `scrypt:${hash}` : hash;
    if (!passwordHash.startsWith("scrypt:")) warn(`Xodim «${s(e.name)}» parolini ko'chirib bo'lmadi — admin panelda yangi parol bering.`);
    employeeData.push({ id: s(e.id)!, name: s(e.name)!, email, phone: s(e.phone), role: String(e.role) as Prisma.EmployeeCreateManyInput["role"], passwordHash, isActive: Boolean(e.isActive), createdAt: d(e.createdAt)!, updatedAt: d(e.updatedAt)! });
  }

  const spWithCost = supplierProducts.filter((x) => x.costPrice !== null).length;
  if (spWithCost) warn(`${spWithCost} ta "yetkazib beruvchi narxi" so'mda edi; stratega-v2 bu yerda USD saqlaydi — ko'chirilmadi (mahsulot tannarxi saqlanadi).`);

  const now = new Date();
  const counts = {
    Kategoriyalar: categories.length, Mahsulotlar: products.length, "Narx tarixi": priceHistory.length, Omborlar: whData.length,
    "Ombor qoldiqlari": stocks.length, "Ombor harakatlari": moveData.length, "Ombor hujjatlari": documents.length,
    "Yetkazib beruvchilar": suppliers.length, "Narxlar ro'yxati": priceLists.length, Mijozlar: customers.length, Xodimlar: employees.length,
    "Sayt foydalanuvchilari": users.length, Arizalar: rfqs.length, Takliflar: quotations.length, Buyurtmalar: orders.length,
    "Jo'natmalar": shipments.length, "To'lovlar": payments.length, "Amallar tarixi": audit.length, Sozlamalar: settings.length,
  };
  console.log(APPLY ? "\nKO'CHIRISH (--apply)\n" : "\nSINOV (dry run) — hech narsa yozilmaydi\n");
  console.table(counts);

  if (!APPLY) {
    finish();
    await src.end();
    return;
  }

  const { prisma } = await import("@/lib/prisma");
  const existing = (await prisma.product.count()) + (await prisma.order.count()) + (await prisma.customer.count());
  if (existing > 0) throw new Error("Nishon bazada allaqachon ma'lumot bor. Faqat bo'sh, yangi bazaga ko'chiring.");

  await prisma.$transaction(
    async (tx) => {
      await tx.category.createMany({ data: categories.map((c) => ({ id: s(c.id)!, slug: s(c.slug)!, name: s(c.name)!, nameRu: s(c.nameRu), nameEn: s(c.nameEn), icon: s(c.icon), imageUrl: s(c.imageUrl), sortOrder: Number(c.sortOrder ?? 0) })) });
      await tx.product.createMany({ data: productData });
      await tx.priceChange.createMany({ data: priceHistory.filter((h) => productIds.has(s(h.productId)!)).map((h) => ({ id: s(h.id)!, productId: s(h.productId)!, oldPrice: Number(h.oldPrice), newPrice: Number(h.newPrice), actor: empName.get(s(h.changedBy) ?? "") ?? s(h.changedBy), createdAt: d(h.createdAt)! })) });
      await tx.warehouse.createMany({ data: whData });
      await tx.stockLevel.createMany({ data: stocks.map((st) => ({ id: s(st.id)!, productId: s(st.productId)!, warehouseId: s(st.warehouseId)!, quantity: Number(st.quantity), reserved: Math.max(0, Number(st.reserved)), updatedAt: d(st.updatedAt)! })) });
      await tx.supplier.createMany({ data: suppliers.map((x) => ({ id: s(x.id)!, name: s(x.name)!, legalName: s(x.legalName), inn: s(x.taxId), contactName: s(x.contactName), phone: s(x.phone), email: s(x.email), address: s(x.address), note: s(x.notes), isActive: Boolean(x.isActive), createdAt: d(x.createdAt)!, updatedAt: d(x.updatedAt)! })) });
      await tx.productSupplier.createMany({ data: supplierProducts.map((x) => ({ id: s(x.id)!, productId: s(x.productId)!, supplierId: s(x.supplierId)!, supplierSku: s(x.supplierSku), leadTimeDays: n(x.leadTimeDays) })) });
      await tx.stockDocument.createMany({ data: documents.map((x) => ({ id: s(x.id)!, number: s(x.number)!, type: String(x.type) as Prisma.StockDocumentCreateManyInput["type"], status: String(x.status) as Prisma.StockDocumentCreateManyInput["status"], warehouseId: s(x.warehouseId)!, targetWarehouseId: s(x.destWarehouseId), supplierId: s(x.supplierId), note: s(x.note), createdBy: empName.get(s(x.responsibleId) ?? "") ?? null, postedAt: d(x.postedAt), createdAt: d(x.createdAt)!, updatedAt: d(x.updatedAt)! })) });
      await tx.stockDocumentLine.createMany({ data: docItems.map((x) => ({ id: s(x.id)!, documentId: s(x.documentId)!, productId: s(x.productId)!, quantity: Number(x.quantity), unitCost: n(x.price) })) });
      await tx.priceList.createMany({ data: plData });
      await tx.priceListItem.createMany({ data: priceListItems.map((x) => ({ id: s(x.id)!, priceListId: s(x.priceListId)!, productId: s(x.productId)!, price: Number(x.price) })) });
      await tx.customer.createMany({ data: customers.map((x) => ({ id: s(x.id)!, companyName: s(x.companyName)!, contactName: s(x.contactName), phone: s(x.phone), email: s(x.email), inn: s(x.taxId), address: s(x.address), priceListId: s(x.priceListId), creditLimit: n(x.creditLimit), note: s(x.notes), isActive: Boolean(x.isActive), createdAt: d(x.createdAt)!, updatedAt: d(x.updatedAt)! })) });
      await tx.user.createMany({ data: users.map((u) => ({ id: s(u.id)!, phone: s(u.phone)!, companyName: s(u.companyName), contactName: s(u.contactName), createdAt: d(u.createdAt)! })) });
      // Same cookie name and raw-token lookup in both apps → customers stay logged in.
      await tx.session.createMany({ data: sessions.filter((x) => d(x.expiresAt)! > now).map((x) => ({ id: s(x.id)!, token: s(x.token)!, userId: s(x.userId)!, expiresAt: d(x.expiresAt)!, createdAt: d(x.createdAt)! })) });
      await tx.rfqRequest.createMany({ data: rfqs.map((x) => ({ id: s(x.id)!, companyName: s(x.companyName)!, contactName: s(x.contactName)!, phone: s(x.phone)!, requestType: s(x.requestType)!, comment: s(x.comment), status: String(x.status) as Prisma.RfqRequestCreateManyInput["status"], userId: s(x.userId), createdAt: d(x.createdAt)!, updatedAt: d(x.updatedAt)! })) });
      await tx.rfqItem.createMany({ data: rfqItems.map((x) => ({ id: s(x.id)!, requestId: s(x.requestId)!, productId: s(x.productId)!, quantity: Number(x.quantity), priceAtQuote: Number(x.priceAtQuote) })) });
      await tx.quotation.createMany({ data: quotations.map((x) => ({ id: s(x.id)!, number: s(x.number)!, customerId: s(x.customerId), rfqRequestId: s(x.rfqRequestId), status: String(x.status) as Prisma.QuotationCreateManyInput["status"], validUntil: d(x.validUntil), note: s(x.note), total: quoteTotal.get(s(x.id)!) ?? 0, createdAt: d(x.createdAt)!, updatedAt: d(x.updatedAt)! })) });
      await tx.quotationLine.createMany({ data: quoteItems.map((x) => ({ id: s(x.id)!, quotationId: s(x.quotationId)!, productId: s(x.productId)!, quantity: Number(x.quantity), price: Number(x.price) })) });
      await tx.order.createMany({ data: orderData });
      await tx.orderLine.createMany({ data: orderItems.map((x) => ({ id: s(x.id)!, orderId: s(x.orderId)!, productId: s(x.productId)!, quantity: Number(x.quantity), price: Number(x.price), costPrice: n(x.costPrice) })) });
      await tx.shipment.createMany({ data: shipments.map((x) => ({ id: s(x.id)!, number: s(x.number)!, orderId: s(x.orderId)!, warehouseId: s(x.warehouseId) ?? orderWh.get(s(x.orderId)!) ?? defaultWh!, status: String(x.status) as Prisma.ShipmentCreateManyInput["status"], assignee: empName.get(s(x.responsibleId) ?? "") ?? null, note: s(x.note), shippedAt: d(x.shippedAt), deliveredAt: d(x.deliveredAt), createdAt: d(x.createdAt)!, updatedAt: d(x.updatedAt)! })) });
      await tx.shipmentLine.createMany({ data: shipmentItems.map((x) => ({ id: s(x.id)!, shipmentId: s(x.shipmentId)!, productId: s(x.productId)!, quantity: Number(x.quantity) })) });
      await tx.payment.createMany({
        data: payments.flatMap((x) => {
          const base = { orderId: s(x.orderId)!, amount: Number(x.amount), method: paymentMethod(x.method), createdAt: d(x.createdAt)! };
          const received = { ...base, id: s(x.id)!, status: "CONFIRMED" as const, note: [s(x.method), s(x.note)].filter(Boolean).join(" — ") || null, paidAt: d(x.receivedAt) ?? d(x.createdAt)! };
          if (String(x.status) !== "REFUNDED") return [received];
          return [received, { ...base, id: `${s(x.id)}-refund`, status: "REFUNDED" as const, note: "Qaytarilgan (Website 2)", paidAt: d(x.updatedAt) ?? d(x.createdAt)! }];
        }),
      });
      await tx.stockMove.createMany({ data: moveData });
      await tx.employee.createMany({ data: employeeData });
      await tx.auditLog.createMany({
        data: audit.map((x) => {
          const old = x.oldData as Prisma.InputJsonValue | null;
          const nw = x.newData as Prisma.InputJsonValue | null;
          return { id: s(x.id)!, action: s(x.action)!, actor: s(x.actorLabel) ?? empName.get(s(x.actorId) ?? "") ?? "system", actorId: s(x.actorId), entityType: s(x.entity), entityId: s(x.entityId), details: old || nw ? { old, new: nw } : undefined, createdAt: d(x.createdAt)! };
        }),
      });
      for (const st of settings) {
        await tx.setting.upsert({ where: { key: s(st.key)! }, create: { key: s(st.key)!, value: settingValue(String(st.value)) }, update: { value: settingValue(String(st.value)) } });
      }
      await tx.auditLog.create({ data: { action: "Website 2 dan ma'lumotlar ko'chirildi", actor: "migratsiya", details: counts } });
    },
    { timeout: 10 * 60_000, maxWait: 60_000 },
  );

  // Sanity checks after the copy.
  const [p, o, lv] = await Promise.all([prisma.product.count(), prisma.order.count(), prisma.stockLevel.aggregate({ _sum: { quantity: true } })]);
  const srcQty = stocks.reduce((a, x) => a + Number(x.quantity), 0);
  console.log(`\nTekshiruv: mahsulotlar ${p}/${products.length}, buyurtmalar ${o}/${orders.length}, jami qoldiq ${lv._sum.quantity ?? 0}/${srcQty}`);
  if (p !== products.length || o !== orders.length || (lv._sum.quantity ?? 0) !== srcQty) throw new Error("Sonlar mos kelmadi — tekshiring!");
  finish();
  await src.end();
  await prisma.$disconnect();
}

function finish() {
  if (warnings.length) {
    console.log("\nE'tibor bering:");
    for (const w of warnings) console.log(` • ${w}`);
  }
  console.log(APPLY ? "\nTayyor. Admin panelda «Ogohlantirishlar → Qayta hisoblash» ni bosing." : "\nHammasi to'g'ri bo'lsa, xuddi shu buyruqni --apply bilan ishga tushiring.");
}

main().catch((e) => {
  console.error("\nXATO:", e instanceof Error ? e.message : e);
  process.exit(1);
});
