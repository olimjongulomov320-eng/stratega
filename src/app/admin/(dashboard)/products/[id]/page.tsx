import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "../product-form";

export default async function EditProductPage(
  props: PageProps<"/admin/products/[id]">
) {
  const { id } = await props.params;

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({ where: { id } }),
    prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!product) notFound();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">
          Mahsulotni tahrirlash
        </h1>
        <Link
          href={`/admin/products/${product.id}/overview`}
          className="text-sm font-medium text-indigo-600 hover:underline"
        >
          To&apos;liq ma&apos;lumot →
        </Link>
      </div>
      <div className="mt-6 max-w-2xl rounded-xl border border-slate-200 bg-white p-6">
        <ProductForm
          categories={categories}
          productId={product.id}
          initialValues={{
            name: product.name,
            description: product.description,
            price: product.price,
            oldPrice: product.oldPrice,
            imageUrl: product.imageUrl,
            categoryId: product.categoryId,
            stock: product.stock,
            isActive: product.isActive,
            isFeatured: product.isFeatured,
            sku: product.sku,
            barcode: product.barcode,
            costPrice: product.costPrice,
            minimumStock: product.minimumStock,
          }}
        />
      </div>
    </div>
  );
}
