import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePage } from "@/lib/admin";
import { can } from "@/lib/permissions";
import { PageHeader, LinkButton } from "@/components/admin/ui";
import { ActionButton } from "@/components/admin/forms";
import { ProductForm } from "../product-form";
import { updateProduct, deleteProduct } from "../actions";

export default async function EditProductPage(props: PageProps<"/admin/products/[id]">) {
  const session = await requirePage("products.write");
  const { id } = await props.params;
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({ where: { id } }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!product) notFound();
  return (
    <div>
      <PageHeader
        title={product.name}
        description="Mahsulotni tahrirlash"
        back={{ href: "/admin/products", label: "Mahsulotlar" }}
        actions={
          <>
            <LinkButton href={`/admin/products/${id}/overview`} variant="secondary">To&apos;liq ma&apos;lumot</LinkButton>
            <a href={`/product/${product.slug}`} target="_blank" className="text-sm text-indigo-600">Saytda ↗</a>
            <ActionButton action={deleteProduct} fields={{ id }} variant="danger" confirm="Mahsulotni butunlay o'chirasizmi?">O&apos;chirish</ActionButton>
          </>
        }
      />
      <ProductForm action={updateProduct} values={product} categories={categories} canSeeCost={can(session.role, "finance.read")} />
    </div>
  );
}
