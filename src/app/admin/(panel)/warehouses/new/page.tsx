import { requirePage } from "@/lib/admin";
import { PageHeader } from "@/components/admin/ui";
import { WarehouseForm } from "../warehouse-form";

export default async function NewWarehousePage() {
  await requirePage("stock.write");
  return (
    <div>
      <PageHeader title="Yangi ombor" back={{ href: "/admin/warehouses", label: "Omborlar" }} />
      <WarehouseForm />
    </div>
  );
}
