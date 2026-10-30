import { prisma } from "@/lib/prisma";
import { requirePage } from "@/lib/admin";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/admin/ui";
import { ProductForm } from "../product-form";
import { createProduct } from "../actions";

export default async function NewProductPage() {
  const session = await requirePage("products.write");
  const [categories, warehouses] = await Promise.all([
    prisma.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    prisma.warehouse.findMany({ where: { isActive: true }, orderBy: [{ isDefault: "desc" }, { name: "asc" }], select: { id: true, name: true } }),
  ]);
  return (
    <div>
      <PageHeader title="Yangi mahsulot" back={{ href: "/admin/products", label: "Mahsulotlar" }} />
      <ProductForm action={createProduct} categories={categories} warehouses={warehouses} canSeeCost={can(session.role, "finance.read")} />
    </div>
  );
}
