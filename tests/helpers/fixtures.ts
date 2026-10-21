import "dotenv/config";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { getMainWarehouseId } from "@/lib/warehouse";

// Testlar uchun noyob identifikator — real ma'lumot bilan aralashmasligi uchun.
export const TEST_PREFIX = `__test__${randomBytes(4).toString("hex")}`;

export type Fixtures = {
  categoryId: string;
  productId: string;
  productSlug: string;
  secondProductId: string;
  warehouseId: string;
  secondWarehouseId: string;
  customerId: string;
  supplierId: string;
  employeeId: string;
  productIds: string[];
  warehouseIds: string[];
};

/**
 * Test uchun izolyatsiyalangan ma'lumot yaratadi:
 * kategoriya, 2 ta mahsulot, 2 ta ombor, mijoz, yetkazib beruvchi, xodim.
 * `cleanupFixtures` orqali butunlay o'chiriladi.
 */
export async function createFixtures(): Promise<Fixtures> {
  const tag = randomBytes(3).toString("hex");

  const category = await prisma.category.create({
    data: {
      slug: `${TEST_PREFIX}-cat-${tag}`,
      name: `${TEST_PREFIX} Kategoriya`,
      sortOrder: 9999,
    },
  });

  const warehouse = await prisma.warehouse.create({
    data: { code: `${TEST_PREFIX}-W1-${tag}`.toUpperCase(), name: `${TEST_PREFIX} Ombor A` },
  });
  const warehouse2 = await prisma.warehouse.create({
    data: { code: `${TEST_PREFIX}-W2-${tag}`.toUpperCase(), name: `${TEST_PREFIX} Ombor B` },
  });

  const product = await prisma.product.create({
    data: {
      slug: `${TEST_PREFIX}-p1-${tag}`,
      name: `${TEST_PREFIX} Mahsulot 1`,
      description: "test",
      price: 100_000,
      costPrice: 60_000,
      sku: `${TEST_PREFIX}-SKU1-${tag}`.toUpperCase(),
      barcode: `${TEST_PREFIX}BC1${tag}`,
      minimumStock: 5,
      reorderPoint: 10,
      reorderQuantity: 50,
      categoryId: category.id,
      isActive: true,
    },
  });
  const product2 = await prisma.product.create({
    data: {
      slug: `${TEST_PREFIX}-p2-${tag}`,
      name: `${TEST_PREFIX} Mahsulot 2`,
      description: "test",
      price: 50_000,
      costPrice: 20_000,
      sku: `${TEST_PREFIX}-SKU2-${tag}`.toUpperCase(),
      categoryId: category.id,
      isActive: true,
    },
  });

  const customer = await prisma.customer.create({
    data: { companyName: `${TEST_PREFIX} Mijoz`, phone: "+998900000000" },
  });
  const supplier = await prisma.supplier.create({
    data: { name: `${TEST_PREFIX} Yetkazib beruvchi`, phone: "+998900000001" },
  });

  const employee = await prisma.employee.create({
    data: {
      name: `${TEST_PREFIX} Xodim`,
      email: `${TEST_PREFIX}-${tag}@test.local`,
      passwordHash: "test-hash",
      role: "OWNER",
    },
  });

  return {
    categoryId: category.id,
    productId: product.id,
    productSlug: product.slug,
    secondProductId: product2.id,
    warehouseId: warehouse.id,
    secondWarehouseId: warehouse2.id,
    customerId: customer.id,
    supplierId: supplier.id,
    employeeId: employee.id,
    productIds: [product.id, product2.id],
    warehouseIds: [warehouse.id, warehouse2.id],
  };
}

/** Test yaratgan barcha ma'lumotni to'liq o'chiradi (real ma'lumotga tegilmaydi). */
export async function cleanupFixtures(f: Fixtures): Promise<void> {
  if (!f) return;
  const orderIds = (
    await prisma.order.findMany({
      where: { items: { some: { productId: { in: f.productIds } } } },
      select: { id: true },
    })
  ).map((o) => o.id);

  await prisma.payment.deleteMany({ where: { orderId: { in: orderIds } } });
  await prisma.shipmentItem.deleteMany({ where: { shipment: { orderId: { in: orderIds } } } });
  await prisma.shipment.deleteMany({ where: { orderId: { in: orderIds } } });
  await prisma.orderItem.deleteMany({ where: { orderId: { in: orderIds } } });
  await prisma.order.deleteMany({ where: { id: { in: orderIds } } });

  await prisma.quotationItem.deleteMany({
    where: { quotation: { items: { some: { productId: { in: f.productIds } } } } },
  });
  await prisma.quotation.deleteMany({
    where: { items: { some: { productId: { in: f.productIds } } } },
  });

  await prisma.rfqItem.deleteMany({ where: { productId: { in: f.productIds } } });
  await prisma.rfqRequest.deleteMany({ where: { items: { some: { productId: { in: f.productIds } } } } });

  await prisma.stockDocumentItem.deleteMany({
    where: { OR: [{ productId: { in: f.productIds } }, { document: { warehouseId: { in: f.warehouseIds } } }] },
  });
  await prisma.stockDocument.deleteMany({
    where: { OR: [{ warehouseId: { in: f.warehouseIds } }, { destWarehouseId: { in: f.warehouseIds } }] },
  });

  await prisma.stockMove.deleteMany({
    where: { OR: [{ productId: { in: f.productIds } }, { warehouseId: { in: f.warehouseIds } }] },
  });
  await prisma.stock.deleteMany({ where: { productId: { in: f.productIds } } });

  await prisma.priceHistory.deleteMany({ where: { productId: { in: f.productIds } } });
  await prisma.priceListItem.deleteMany({ where: { productId: { in: f.productIds } } });
  await prisma.supplierProduct.deleteMany({ where: { productId: { in: f.productIds } } });
  await prisma.alert.deleteMany({ where: { entityId: { in: f.productIds } } });
  await prisma.auditLog.deleteMany({ where: { entityId: { in: [...f.productIds, ...f.warehouseIds] } } });

  await prisma.customer.deleteMany({ where: { id: f.customerId } });
  await prisma.supplier.deleteMany({ where: { id: f.supplierId } });
  await prisma.employee.deleteMany({ where: { id: f.employeeId } });
  await prisma.product.deleteMany({ where: { id: { in: f.productIds } } });
  await prisma.category.deleteMany({ where: { id: f.categoryId } });
  await prisma.warehouse.deleteMany({ where: { id: { in: f.warehouseIds } } });
}

/** Mahsulot-ombor bo'yicha joriy qoldiqni o'qiydi. */
export async function readStock(productId: string, warehouseId: string) {
  const row = await prisma.stock.findUnique({
    where: { productId_warehouseId: { productId, warehouseId } },
  });
  const quantity = row?.quantity ?? 0;
  const reserved = row?.reserved ?? 0;
  return { quantity, reserved, available: quantity - reserved };
}

/** Mahsulot jami qoldig'i (barcha omborlar). */
export async function readTotalStock(productId: string) {
  const agg = await prisma.stock.aggregate({
    where: { productId },
    _sum: { quantity: true },
  });
  return agg._sum.quantity ?? 0;
}

export async function ensureMainWarehouse(): Promise<string> {
  return getMainWarehouseId();
}
