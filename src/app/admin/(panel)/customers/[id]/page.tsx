import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePage } from "@/lib/admin";
import { can } from "@/lib/permissions";
import { PageHeader, Card, Table, Td, Badge, Money, Stat, LinkButton } from "@/components/admin/ui";
import { formatDate } from "@/lib/format";
import { ORDER_STATUS, PAYMENT_STATUS } from "@/lib/labels";
import { CustomerForm } from "../customer-form";

export default async function CustomerPage(props: PageProps<"/admin/customers/[id]">) {
  const session = await requirePage("customers.read");
  const { id } = await props.params;
  const [customer, priceLists] = await Promise.all([
    prisma.customer.findUnique({ where: { id }, include: { orders: { orderBy: { createdAt: "desc" } }, quotations: { orderBy: { createdAt: "desc" }, take: 10 } } }),
    prisma.priceList.findMany({ where: { isActive: true }, select: { id: true, name: true } }),
  ]);
  if (!customer) notFound();
  const sales = customer.orders.filter((o) => ["CONFIRMED", "SHIPPED", "COMPLETED"].includes(o.status));
  const revenue = sales.reduce((s, o) => s + o.total, 0);
  const debt = sales.reduce((s, o) => s + o.total - o.paidAmount, 0);
  return (
    <div>
      <PageHeader
        title={customer.companyName}
        back={{ href: "/admin/customers", label: "Mijozlar" }}
        actions={can(session.role, "orders.write") && <LinkButton href={`/admin/orders/new?customer=${id}`}>+ Buyurtma</LinkButton>}
      />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Buyurtmalar" value={sales.length} />
        <Stat label="Jami savdo" value={<Money value={revenue} />} />
        <Stat label="Qarzi" value={<Money value={debt} />} tone={debt > 0 ? "warn" : "default"} />
        <Stat label="Kredit limiti" value={<Money value={customer.creditLimit} />} tone={customer.creditLimit && debt > customer.creditLimit ? "bad" : "default"} />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div>{can(session.role, "customers.write") ? <CustomerForm values={customer} priceLists={priceLists} /> : null}</div>
        <Card title="Buyurtmalar">
          <Table head={["Raqam", "Sana", "Summa", "Holat", "To'lov"]} empty="Buyurtmalar yo'q.">
            {customer.orders.map((o) => (
              <tr key={o.id}>
                <Td><Link href={`/admin/orders/${o.id}`} className="text-indigo-600">{o.number}</Link></Td>
                <Td className="text-xs">{formatDate(o.createdAt)}</Td>
                <Td right><Money value={o.total} /></Td>
                <Td><Badge tone={ORDER_STATUS[o.status].tone}>{ORDER_STATUS[o.status].label}</Badge></Td>
                <Td><Badge tone={PAYMENT_STATUS[o.paymentStatus].tone}>{PAYMENT_STATUS[o.paymentStatus].label}</Badge></Td>
              </tr>
            ))}
          </Table>
        </Card>
      </div>
    </div>
  );
}
