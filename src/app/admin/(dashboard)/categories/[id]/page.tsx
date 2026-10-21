import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CategoryForm } from "../category-form";
import { requirePagePermission } from "@/lib/require-permission";

export default async function EditCategoryPage(
  props: PageProps<"/admin/categories/[id]">
) {
  await requirePagePermission("products.write");
  const { id } = await props.params;

  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">
        Kategoriyani tahrirlash
      </h1>
      <div className="mt-6 max-w-lg rounded-xl border border-slate-200 bg-white p-6">
        <CategoryForm
          categoryId={category.id}
          initialValues={{
            name: category.name,
            icon: category.icon ?? "",
            imageUrl: category.imageUrl,
            sortOrder: category.sortOrder,
          }}
        />
      </div>
    </div>
  );
}
