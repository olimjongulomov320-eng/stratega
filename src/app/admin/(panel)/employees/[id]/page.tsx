import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePage } from "@/lib/admin";
import { PageHeader } from "@/components/admin/ui";
import { EmployeeForm } from "../employee-form";

export default async function EditEmployeePage(props: PageProps<"/admin/employees/[id]">) {
  await requirePage("users.manage");
  const { id } = await props.params;
  const e = await prisma.employee.findUnique({ where: { id }, select: { id: true, name: true, email: true, phone: true, telegramId: true, role: true, isActive: true } });
  if (!e) notFound();
  return (
    <div>
      <PageHeader title={e.name} back={{ href: "/admin/employees", label: "Xodimlar" }} />
      <EmployeeForm values={e} />
    </div>
  );
}
