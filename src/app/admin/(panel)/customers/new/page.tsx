import { prisma } from "@/lib/prisma";
import { requirePage } from "@/lib/admin";
import { PageHeader } from "@/components/admin/ui";
import { CustomerForm } from "../customer-form";

export default async function NewCustomerPage(props: PageProps<"/admin/customers/new">) {
  await requirePage("customers.write");
  const sp = await props.searchParams;
  const priceLists = await prisma.priceList.findMany({ where: { isActive: true }, select: { id: true, name: true } });
  const returnTo = typeof sp.returnTo === "string" ? sp.returnTo : undefined;
  return (
    <div>
      <PageHeader title="Yangi mijoz" back={{ href: "/admin/customers", label: "Mijozlar" }} />
      <CustomerForm
        priceLists={priceLists}
        returnTo={returnTo}
        values={{
          companyName: typeof sp.company === "string" ? sp.company : undefined,
          contactName: typeof sp.contact === "string" ? sp.contact : undefined,
          phone: typeof sp.phone === "string" ? sp.phone : undefined,
        }}
      />
    </div>
  );
}
