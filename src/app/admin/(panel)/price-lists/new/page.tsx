import { requirePage } from "@/lib/admin";
import { PageHeader } from "@/components/admin/ui";
import { PriceListForm } from "../list-form";

export default async function NewPriceListPage() {
  await requirePage("finance.write");
  return (
    <div>
      <PageHeader title="Yangi narx ro'yxati" back={{ href: "/admin/price-lists", label: "Narxlar ro'yxatlari" }} />
      <PriceListForm />
    </div>
  );
}
