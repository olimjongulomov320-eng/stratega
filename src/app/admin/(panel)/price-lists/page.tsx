import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePage } from "@/lib/admin";
import { can } from "@/lib/permissions";
import { PageHeader, Table, Td, Badge, LinkButton } from "@/components/admin/ui";

export default async function PriceListsPage() {
  const session = await requirePage("finance.read");
  const lists = await prisma.priceList.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { items: true, customers: true } } } });
  return (
    <div>
      <PageHeader
        title="Narxlar ro'yxatlari"
        description="Mijozlar guruhi uchun maxsus narxlar. Ro'yxatda narxi yo'q mahsulot sayt narxi bo'yicha hisoblanadi."
        actions={can(session.role, "finance.write") && <LinkButton href="/admin/price-lists/new">+ Yangi ro&apos;yxat</LinkButton>}
      />
      <Table head={["Nomi", "Kod", "Narxlar", "Mijozlar", "Holat"]} empty="Narxlar ro'yxati yo'q.">
        {lists.map((l) => (
          <tr key={l.id} className="hover:bg-slate-50">
            <Td><Link href={`/admin/price-lists/${l.id}`} className="font-medium text-indigo-600">{l.name}</Link></Td>
            <Td className="font-mono text-xs">{l.code}</Td>
            <Td right>{l._count.items}</Td>
            <Td right>{l._count.customers}</Td>
            <Td>{l.isActive ? <Badge tone="green">Faol</Badge> : <Badge>Nofaol</Badge>}</Td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
