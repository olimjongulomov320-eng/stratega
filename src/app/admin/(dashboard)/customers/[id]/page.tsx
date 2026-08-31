import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { CustomerForm } from "../customer-form";

export const dynamic = "force-dynamic";

export default async function EditCustomerPage(
  props: PageProps<"/admin/customers/[id]">
) {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const { id } = await props.params;
  const [customer, priceLists] = await Promise.all([
    prisma.customer.findUnique({ where: { id } }),
    prisma.priceList.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);
  if (!customer) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">
        Mijozni tahrirlash
      </h1>
      <div className="mt-6 max-w-2xl rounded-xl border border-slate-200 bg-white p-6">
        <CustomerForm
          customerId={customer.id}
          priceLists={priceLists}
          initialValues={{
            companyName: customer.companyName,
            contactName: customer.contactName ?? "",
            phone: customer.phone ?? "",
            email: customer.email ?? "",
            address: customer.address ?? "",
            taxId: customer.taxId ?? "",
            notes: customer.notes ?? "",
            creditLimit: customer.creditLimit,
            priceListId: customer.priceListId,
            isActive: customer.isActive,
          }}
        />
      </div>
    </div>
  );
}
