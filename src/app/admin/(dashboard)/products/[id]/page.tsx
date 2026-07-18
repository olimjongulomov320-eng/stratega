import { notFound } from "next/navigation";
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
      <h1 className="text-2xl font-bold text-slate-900">
        Mahsulotni tahrirlash
      </h1>
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
          }}
        />
      </div>
    </div>
  );
}
