import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePage } from "@/lib/admin";
import { can } from "@/lib/permissions";
import { PageHeader, Table, Td, Badge, LinkButton, Card, inputCls } from "@/components/admin/ui";
import { ActionForm, Submit } from "@/components/admin/forms";
import { importSuppliers } from "./actions";

export default async function SuppliersPage() {
  const session = await requirePage("suppliers.read");
  const suppliers = await prisma.supplier.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { products: true, documents: true } } } });
  return (
    <div>
      <PageHeader title="Yetkazib beruvchilar" description="Mahsulotlarni kimdan sotib olasiz." actions={<><LinkButton href="/admin/analytics/suppliers" variant="secondary">Tahlil</LinkButton>{can(session.role, "suppliers.write") && <LinkButton href="/admin/suppliers/new">+ Yangi yetkazib beruvchi</LinkButton>}</>} />
      <Table head={["Nomi", "Mamlakat", "Aloqa", "Mahsulotlar", "Kirim hujjatlari", "Holat"]} empty="Hozircha yetkazib beruvchilar yo'q.">
        {suppliers.map((s) => (
          <tr key={s.id} className="hover:bg-slate-50">
            <Td><Link href={`/admin/suppliers/${s.id}`} className="font-medium text-slate-800 hover:text-indigo-600">{s.name}</Link><div className="text-xs text-slate-400">{s.legalName}</div></Td>
            <Td>{s.country ?? "—"}</Td>
            <Td>{s.contactName ?? "—"}<div className="text-xs text-slate-400">{s.phone ?? s.email}</div></Td>
            <Td right>{s._count.products}</Td>
            <Td right>{s._count.documents}</Td>
            <Td>{s.isActive ? <Badge tone="green">Faol</Badge> : <Badge>Nofaol</Badge>}</Td>
          </tr>
        ))}
      </Table>
      {can(session.role, "suppliers.write") && (
        <Card title="Excel / CSV import" className="mt-6 max-w-2xl">
          <p className="text-sm text-slate-500">
            Birinchi qator — sarlavha, ustunlar istalgan tartibda: <code>nomi, yuridik_nomi, inn, aloqa, telefon, email, manzil, mamlakat, izoh</code>. Mavjud yetkazib beruvchi (INN yoki nomi bo&apos;yicha) yangilanadi — takror yaratilmaydi.
          </p>
          <ActionForm action={importSuppliers} className="mt-3 flex flex-wrap items-center gap-3">
            <input type="file" name="file" accept=".csv,.xlsx,text/csv" required className={`${inputCls} max-w-sm`} />
            <Submit size="sm">Yuklash</Submit>
          </ActionForm>
        </Card>
      )}
    </div>
  );
}
