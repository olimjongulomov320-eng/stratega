import { prisma } from "@/lib/prisma";
import { ProductForm } from "../product-form";
import { requirePagePermission } from "@/lib/require-permission";

export default async function NewProductPage() {
  await requirePagePermission("products.write");
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Yangi mahsulot</h1>
      <div className="mt-6 max-w-2xl rounded-xl border border-slate-200 bg-white p-6">
        <ProductForm categories={categories} />
      </div>
    </div>
  );
}
