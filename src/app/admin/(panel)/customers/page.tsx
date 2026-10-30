import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePage } from "@/lib/admin";
import { can } from "@/lib/permissions";
import { PageHeader, Table, Td, Badge, Money, LinkButton, Card, Filters, inputCls, btn, DownloadLink } from "@/components/admin/ui";
import { ActionForm, Submit } from "@/components/admin/forms";
import { importCustomers } from "./actions";

export default async function CustomersPage(props: PageProps<"/admin/customers">) {
  const session = await requirePage("customers.read");
  const sp = await props.searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const customers = await prisma.customer.findMany({
    where: q ? { OR: [{ companyName: { contains: q, mode: "insensitive" } }, { phone: { contains: q } }, { inn: { contains: q } }, { contactName: { contains: q, mode: "insensitive" } }] } : {},
    orderBy: { companyName: "asc" },
    include: { priceList: true, orders: { where: { status: { in: ["CONFIRMED", "SHIPPED", "COMPLETED"] } }, select: { total: true, paidAmount: true } } },
  });
  const canWrite = can(session.role, "customers.write");
  return (
    <div>
      <PageHeader
        title="Mijozlar"
        description="B2B mijozlar ro'yxati (saytdagi foydalanuvchilardan alohida)."
        actions={<><DownloadLink href="/api/admin/export?type=customers">CSV yuklab olish</DownloadLink>{canWrite && <LinkButton href="/admin/customers/new">+ Yangi mijoz</LinkButton>}</>}
      />
      <Filters>
        <input name="q" defaultValue={q} placeholder="Nomi, telefon, INN" className={`${inputCls} max-w-xs`} />
        <button className={btn("secondary")}>Qidirish</button>
      </Filters>
      <Table head={["Kompaniya", "Aloqa", "Narx ro'yxati", "Kredit limiti", "Buyurtmalar", "Qarzi", "Holat"]} empty="Hozircha mijozlar yo'q.">
        {customers.map((c) => {
          const debt = c.orders.reduce((s, o) => s + o.total - o.paidAmount, 0);
          return (
            <tr key={c.id} className="hover:bg-slate-50">
              <Td><Link href={`/admin/customers/${c.id}`} className="font-medium text-slate-800 hover:text-indigo-600">{c.companyName}</Link><div className="text-xs text-slate-400">{c.inn ? `INN ${c.inn}` : ""}</div></Td>
              <Td>{c.contactName ?? "—"}<div className="text-xs text-slate-400">{c.phone}</div></Td>
              <Td>{c.priceList?.name ?? "Standart"}</Td>
              <Td right><Money value={c.creditLimit} /></Td>
              <Td right>{c.orders.length}</Td>
              <Td right><span className={debt > 0 ? "text-amber-600" : ""}><Money value={debt} /></span></Td>
              <Td>{c.isActive ? <Badge tone="green">Faol</Badge> : <Badge>Nofaol</Badge>}</Td>
            </tr>
          );
        })}
      </Table>
      {canWrite && (
        <Card title="Excel / CSV import" className="mt-6 max-w-2xl">
          <p className="text-sm text-slate-500">Birinchi qator — sarlavha, ustunlar istalgan tartibda: <code>kompaniya, aloqa, telefon, email, inn, manzil, kredit_limiti, izoh</code>. Mavjud mijoz (INN yoki nomi bo&apos;yicha) yangilanadi — takror yaratilmaydi.</p>
          <ActionForm action={importCustomers} className="mt-3 flex flex-wrap items-center gap-3">
            <input type="file" name="file" accept=".csv,.xlsx,text/csv" required className={`${inputCls} max-w-sm`} />
            <Submit size="sm">Yuklash</Submit>
          </ActionForm>
        </Card>
      )}
    </div>
  );
}
