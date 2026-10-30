import { requirePage } from "@/lib/admin";
import { PageHeader } from "@/components/admin/ui";
import { CategoryForm } from "../category-form";

export default async function NewCategoryPage() {
  await requirePage("products.write");
  return (
    <div>
      <PageHeader title="Yangi kategoriya" back={{ href: "/admin/categories", label: "Kategoriyalar" }} />
      <CategoryForm />
    </div>
  );
}
