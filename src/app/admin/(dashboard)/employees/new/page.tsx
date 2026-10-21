import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { EmployeeForm } from "../employee-form";
import { requirePagePermission } from "@/lib/require-permission";

export const dynamic = "force-dynamic";

export default async function NewEmployeePage() {
  await requirePagePermission("users.manage");
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Yangi xodim</h1>
      <div className="mt-6 max-w-2xl rounded-xl border border-slate-200 bg-white p-6">
        <EmployeeForm />
      </div>
    </div>
  );
}
