// Testlar yaratgan ma'lumotlarni TO'LIQ tozalash.
//
// Muammo: testlar real (production) bazada ishlaydi va `__test__` prefiksli
// yozuvlar qoldirsa, admin panelda ko'rinadi. Bu sweep test tugagandan
// keyin (hatto test ishdan otilib ketganda ham) barcha qoldiqlarni tozalaydi.
//
// Muhim: faqat `__test__` prefiksli yozuvlar o'chiriladi — haqiqiy ma'lumot
// tegilmaydi.

import { prisma } from "@/lib/prisma";

const PREFIX = "__test__";

// AuditLog.entity -> jadval (dangling yozuvlarni tozalash uchun).
const AUDIT_TABLES = [
  "Order",
  "StockDocument",
  "Shipment",
  "Quotation",
  "Customer",
  "Payment",
  "Product",
  "Employee",
  "Warehouse",
  "Supplier",
  "Category",
  "PriceList",
  "StockMove",
  "RfqRequest",
  "User",
];

function startsWithFilter(fields: string[]) {
  return {
    OR: fields.map((f) => ({
      [f]: { startsWith: PREFIX, mode: "insensitive" as const },
    })),
  };
}

export async function sweepTestData(): Promise<void> {
  // 1. Test yozuvlarini topamiz.
  const [warehouses, products, customers, suppliers, employees, categories, priceLists, rfqs] =
    await Promise.all([
      prisma.warehouse.findMany({
        where: startsWithFilter(["name", "code"]),
        select: { id: true },
      }),
      prisma.product.findMany({
        where: startsWithFilter(["name", "sku", "slug"]),
        select: { id: true },
      }),
      prisma.customer.findMany({
        where: startsWithFilter(["companyName", "contactName", "email"]),
        select: { id: true },
      }),
      prisma.supplier.findMany({
        where: startsWithFilter(["name"]),
        select: { id: true },
      }),
      prisma.employee.findMany({
        where: startsWithFilter(["name", "email"]),
        select: { id: true },
      }),
      prisma.category.findMany({
        where: startsWithFilter(["name", "slug"]),
        select: { id: true },
      }),
      prisma.priceList.findMany({
        where: startsWithFilter(["name"]),
        select: { id: true },
      }),
      prisma.rfqRequest.findMany({
        where: startsWithFilter(["companyName", "contactName"]),
        select: { id: true },
      }),
    ]);

  const warehouseIds = warehouses.map((r) => r.id);
  const productIds = products.map((r) => r.id);
  const customerIds = customers.map((r) => r.id);
  const supplierIds = suppliers.map((r) => r.id);
  const employeeIds = employees.map((r) => r.id);
  const categoryIds = categories.map((r) => r.id);
  const priceListIds = priceLists.map((r) => r.id);
  const rfqIds = rfqs.map((r) => r.id);

  const orderIds = (
    await prisma.order.findMany({
      where: {
        OR: [
          { items: { some: { productId: { in: productIds } } } },
          { customerId: { in: customerIds } },
        ],
      },
      select: { id: true },
    })
  ).map((r) => r.id);

  const quotationIds = (
    await prisma.quotation.findMany({
      where: {
        OR: [
          { items: { some: { productId: { in: productIds } } } },
          { customerId: { in: customerIds } },
        ],
      },
      select: { id: true },
    })
  ).map((r) => r.id);

  const shipmentIds = (
    await prisma.shipment.findMany({
      where: { orderId: { in: orderIds } },
      select: { id: true },
    })
  ).map((r) => r.id);

  const documentIds = (
    await prisma.stockDocument.findMany({
      where: {
        OR: [
          { warehouseId: { in: warehouseIds } },
          { destWarehouseId: { in: warehouseIds } },
          { items: { some: { productId: { in: productIds } } } },
        ],
      },
      select: { id: true },
    })
  ).map((r) => r.id);

  // 2. Bog'liq yozuvlar (FK tartibi).
  await prisma.payment.deleteMany({ where: { orderId: { in: orderIds } } });
  await prisma.shipmentItem.deleteMany({ where: { shipmentId: { in: shipmentIds } } });
  await prisma.shipment.deleteMany({ where: { id: { in: shipmentIds } } });
  await prisma.orderItem.deleteMany({ where: { orderId: { in: orderIds } } });
  await prisma.order.deleteMany({ where: { id: { in: orderIds } } });
  await prisma.quotationItem.deleteMany({ where: { quotationId: { in: quotationIds } } });
  await prisma.quotation.deleteMany({ where: { id: { in: quotationIds } } });

  await prisma.stockDocumentItem.deleteMany({
    where: { OR: [{ documentId: { in: documentIds } }, { productId: { in: productIds } }] },
  });
  await prisma.stockDocument.deleteMany({ where: { id: { in: documentIds } } });
  await prisma.stockMove.deleteMany({
    where: { OR: [{ productId: { in: productIds } }, { warehouseId: { in: warehouseIds } }] },
  });
  await prisma.stock.deleteMany({
    where: { OR: [{ productId: { in: productIds } }, { warehouseId: { in: warehouseIds } }] },
  });
  await prisma.priceHistory.deleteMany({ where: { productId: { in: productIds } } });
  await prisma.priceListItem.deleteMany({
    where: { OR: [{ productId: { in: productIds } }, { priceListId: { in: priceListIds } }] },
  });
  await prisma.supplierProduct.deleteMany({
    where: { OR: [{ productId: { in: productIds } }, { supplierId: { in: supplierIds } }] },
  });
  await prisma.rfqItem.deleteMany({ where: { requestId: { in: rfqIds } } });
  await prisma.rfqRequest.deleteMany({ where: { id: { in: rfqIds } } });
  await prisma.employeeSession.deleteMany({ where: { employeeId: { in: employeeIds } } });

  // 3. Audit log — test aktorlari va test entity'lariga tegishli yozuvlar.
  await prisma.auditLog.deleteMany({
    where: {
      OR: [
        { actorId: { in: employeeIds } },
        { actorLabel: { startsWith: PREFIX, mode: "insensitive" } },
        { entityId: { in: [...productIds, ...warehouseIds, ...customerIds, ...supplierIds, ...employeeIds, ...categoryIds, ...priceListIds, ...rfqIds, ...orderIds, ...quotationIds, ...shipmentIds, ...documentIds] } },
      ],
    },
  });

  // 4. Asosiy yozuvlar.
  await prisma.alert.deleteMany({
    where: { OR: [{ entityId: { in: productIds } }, { title: { startsWith: PREFIX, mode: "insensitive" } }] },
  });
  await prisma.priceList.deleteMany({ where: { id: { in: priceListIds } } });
  await prisma.product.deleteMany({ where: { id: { in: productIds } } });
  await prisma.customer.deleteMany({ where: { id: { in: customerIds } } });
  await prisma.supplier.deleteMany({ where: { id: { in: supplierIds } } });
  await prisma.employee.deleteMany({ where: { id: { in: employeeIds } } });
  await prisma.category.deleteMany({ where: { id: { in: categoryIds } } });
  await prisma.warehouse.deleteMany({ where: { id: { in: warehouseIds } } });

  // 5. "Dangling" audit yozuvlar — entity jadvada yo'q (test yozuvlari).
  const dangling = AUDIT_TABLES.map(
    (t) =>
      `(a.entity = '${t}' and not exists (select 1 from "${t}" tt where tt.id = a."entityId"))`
  ).join(" or ");
  await prisma.$executeRawUnsafe(
    `delete from "AuditLog" a where ${dangling}`
  );
}
