import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePage } from "@/lib/admin";
import { ROLE_LABELS } from "@/lib/permissions";
import { PageHeader, Table, Td, Badge, LinkButton } from "@/components/admin/ui";
import { formatDate } from "@/lib/format";

export default async function EmployeesPage() {
  await requirePage("users.manage");
  const employees = await prisma.employee.findMany({ orderBy: [{ isActive: "desc" }, { name: "asc" }] });
  return (
    <div>
      <PageHeader title="Xodimlar" description="Boshqaruv paneliga kiruvchi xodimlar va ularning rollari." actions={<LinkButton href="/admin/employees/new">+ Yangi xodim</LinkButton>} />
      <Table head={["Ism", "Email", "Rol", "Oxirgi kirish", "Holat"]} empty="Xodimlar yo'q.">
        {employees.map((e) => (
          <tr key={e.id} className="hover:bg-slate-50">
            <Td><Link href={`/admin/employees/${e.id}`} className="font-medium text-indigo-600">{e.name}</Link></Td>
            <Td>{e.email}</Td>
            <Td>{ROLE_LABELS[e.role].name}</Td>
            <Td className="text-xs">{e.lastLoginAt ? formatDate(e.lastLoginAt, true) : "—"}</Td>
            <Td>{e.isActive ? <Badge tone="green">Faol</Badge> : <Badge>Bloklangan</Badge>}</Td>
          </tr>
        ))}
      </Table>
      <p className="mt-3 text-xs text-slate-400">Umumiy admin paroli (ADMIN_PASSWORD) Egasi huquqi bilan kiradi — uni faqat favqulodda holatlar uchun saqlang va har bir xodimga alohida hisob yarating.</p>
    </div>
  );
}
