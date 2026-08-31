import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { CustomerForm } from "../customer-form";

export const dynamic = "force-dynamic";

export default async function NewCustomerPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const priceLists = await prisma.priceList.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Yangi mijoz</h1>
      <div className="mt-6 max-w-2xl rounded-xl border border-slate-200 bg-white p-6">
        <CustomerForm priceLists={priceLists} />
      </div>
    </div>
  );
}
