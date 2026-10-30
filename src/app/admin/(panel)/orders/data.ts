import { prisma } from "@/lib/prisma";

export async function orderFormData() {
  const [products, customers, warehouses] = await Promise.all([
    prisma.product.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, include: { stockLevels: true } }),
    prisma.customer.findMany({ where: { isActive: true }, orderBy: { companyName: "asc" }, select: { id: true, companyName: true } }),
    prisma.warehouse.findMany({ where: { isActive: true }, orderBy: [{ isDefault: "desc" }, { name: "asc" }], select: { id: true, name: true } }),
  ]);
  return {
    products: products.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      barcode: p.barcode,
      price: p.price,
      available: p.stockLevels.reduce((s, l) => s + l.quantity - l.reserved, 0),
    })),
    customers: customers.map((c) => ({ id: c.id, name: c.companyName })),
    warehouses,
  };
}
