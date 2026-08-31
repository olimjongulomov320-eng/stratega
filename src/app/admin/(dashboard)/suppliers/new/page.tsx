import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { SupplierForm } from "../supplier-form";

export const dynamic = "force-dynamic";

export default async function NewSupplierPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">
        Yangi yetkazib beruvchi
      </h1>
      <div className="mt-6 max-w-2xl rounded-xl border border-slate-200 bg-white p-6">
        <SupplierForm />
      </div>
    </div>
  );
}
