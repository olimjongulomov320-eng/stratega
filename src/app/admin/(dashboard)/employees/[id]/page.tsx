import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { EmployeeForm } from "../employee-form";

export const dynamic = "force-dynamic";

export default async function EditEmployeePage(
  props: PageProps<"/admin/employees/[id]">
) {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const { id } = await props.params;
  const employee = await prisma.employee.findUnique({ where: { id } });
  if (!employee) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">
        Xodimni tahrirlash
      </h1>
      <div className="mt-6 max-w-2xl rounded-xl border border-slate-200 bg-white p-6">
        <EmployeeForm
          employeeId={employee.id}
          initialValues={{
            name: employee.name,
            email: employee.email ?? "",
            phone: employee.phone ?? "",
            role: employee.role,
            isActive: employee.isActive,
          }}
        />
      </div>
    </div>
  );
}
