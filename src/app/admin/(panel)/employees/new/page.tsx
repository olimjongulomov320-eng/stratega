import { requirePage } from "@/lib/admin";
import { PageHeader } from "@/components/admin/ui";
import { EmployeeForm } from "../employee-form";

export default async function NewEmployeePage() {
  await requirePage("users.manage");
  return (
    <div>
      <PageHeader title="Yangi xodim" back={{ href: "/admin/employees", label: "Xodimlar" }} />
      <EmployeeForm />
    </div>
  );
}
