import { requirePage } from "@/lib/admin";
import { PageHeader } from "@/components/admin/ui";
import { SupplierForm } from "../supplier-form";

export default async function NewSupplierPage() {
  await requirePage("suppliers.write");
  return (
    <div>
      <PageHeader title="Yangi yetkazib beruvchi" back={{ href: "/admin/suppliers", label: "Yetkazib beruvchilar" }} />
      <SupplierForm />
    </div>
  );
}
