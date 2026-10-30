import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePage } from "@/lib/admin";
import { PageHeader } from "@/components/admin/ui";
import { ActionButton } from "@/components/admin/forms";
import { CategoryForm } from "../category-form";
import { deleteCategory } from "../actions";

export default async function EditCategoryPage(props: PageProps<"/admin/categories/[id]">) {
  await requirePage("products.write");
  const { id } = await props.params;
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) notFound();
  return (
    <div>
      <PageHeader
        title={category.name}
        back={{ href: "/admin/categories", label: "Kategoriyalar" }}
        actions={<ActionButton action={deleteCategory} fields={{ id }} variant="danger" confirm="Kategoriyani o'chirasizmi?">O&apos;chirish</ActionButton>}
      />
      <CategoryForm values={category} />
    </div>
  );
}
