import { prisma } from "@/lib/prisma";
import { requirePage } from "@/lib/admin";
import { PageHeader, Empty } from "@/components/admin/ui";
import { DocForm } from "../doc-form";

export default async function NewDocPage(props: PageProps<"/admin/stock-documents/new">) {
  await requirePage("stock.write");
  const sp = await props.searchParams;
  const [products, warehouses, suppliers] = await Promise.all([
    prisma.product.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, sku: true, barcode: true, price: true, costPrice: true, stock: true } }),
    prisma.warehouse.findMany({ where: { isActive: true }, orderBy: [{ isDefault: "desc" }, { name: "asc" }], select: { id: true, name: true } }),
    prisma.supplier.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  return (
    <div>
      <PageHeader title="Yangi ombor hujjati" back={{ href: "/admin/stock-documents", label: "Ombor hujjatlari" }} />
      {warehouses.length === 0 ? (
        <Empty>Avval ombor yarating.</Empty>
      ) : (
        <DocForm
          products={products.map((p) => ({ ...p, available: p.stock }))}
          warehouses={warehouses}
          suppliers={suppliers}
          initialType={typeof sp.type === "string" ? sp.type : "RECEIPT"}
        />
      )}
    </div>
  );
}
