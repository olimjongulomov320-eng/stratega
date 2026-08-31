import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { SupplierForm } from "../supplier-form";

export const dynamic = "force-dynamic";

export default async function EditSupplierPage(
  props: PageProps<"/admin/suppliers/[id]">
) {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const { id } = await props.params;
  const supplier = await prisma.supplier.findUnique({ where: { id } });
  if (!supplier) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">
        Yetkazib beruvchini tahrirlash
      </h1>
      <div className="mt-6 max-w-2xl rounded-xl border border-slate-200 bg-white p-6">
        <SupplierForm
          supplierId={supplier.id}
          initialValues={{
            name: supplier.name,
            legalName: supplier.legalName ?? "",
            phone: supplier.phone ?? "",
            email: supplier.email ?? "",
            contactName: supplier.contactName ?? "",
            address: supplier.address ?? "",
            taxId: supplier.taxId ?? "",
            notes: supplier.notes ?? "",
            isActive: supplier.isActive,
          }}
        />
      </div>
    </div>
  );
}
