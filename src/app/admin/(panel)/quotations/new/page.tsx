import { prisma } from "@/lib/prisma";
import { requirePage } from "@/lib/admin";
import { PageHeader } from "@/components/admin/ui";
import { QuoteForm } from "../quote-form";
import { createQuotation } from "../actions";

export default async function NewQuotePage() {
  await requirePage("orders.write");
  const [products, customers] = await Promise.all([
    prisma.product.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true, sku: true, barcode: true, price: true, stock: true } }),
    prisma.customer.findMany({ where: { isActive: true }, orderBy: { companyName: "asc" }, select: { id: true, companyName: true } }),
  ]);
  return (
    <div>
      <PageHeader title="Yangi taklif (KP)" back={{ href: "/admin/quotations", label: "Takliflar" }} />
      <QuoteForm action={createQuotation} products={products.map((p) => ({ ...p, available: p.stock }))} customers={customers.map((c) => ({ id: c.id, name: c.companyName }))} />
    </div>
  );
}
