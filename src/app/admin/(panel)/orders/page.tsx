import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePage } from "@/lib/admin";
import { can } from "@/lib/permissions";
import { PageHeader, Table, Td, Badge, Money, LinkButton, Filters, inputCls, btn, DownloadLink } from "@/components/admin/ui";
import { formatDate } from "@/lib/format";
import { ORDER_STATUS, PAYMENT_STATUS } from "@/lib/labels";
import type { OrderStatus } from "@/generated/prisma/client";

export default async function OrdersPage(props: PageProps<"/admin/orders">) {
  const session = await requirePage("orders.read");
  const sp = await props.searchParams;
  const status = typeof sp.status === "string" && sp.status in ORDER_STATUS ? (sp.status as OrderStatus) : undefined;
  const orders = await prisma.order.findMany({ where: status ? { status } : {}, orderBy: { createdAt: "desc" }, take: 300, include: { customer: true, warehouse: true } });
  return (
    <div>
      <PageHeader
        title="Buyurtmalar"
        description="Mijozlar bilan barcha buyurtmalar."
        actions={<><DownloadLink href="/api/admin/export?type=orders">CSV yuklab olish</DownloadLink>{can(session.role, "orders.write") && <LinkButton href="/admin/orders/new">+ Yangi buyurtma</LinkButton>}</>}
      />
      <Filters>
        <select name="status" defaultValue={status ?? ""} className={`${inputCls} max-w-xs`}>
          <option value="">Barcha holatlar</option>
          {Object.entries(ORDER_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <button className={btn("secondary")}>Ko&apos;rsatish</button>
      </Filters>
      <Table head={["Raqam", "Mijoz", "Ombor", "Summa", "To'langan", "Holat", "To'lov", "Sana"]} empty="Hozircha buyurtmalar yo'q.">
        {orders.map((o) => (
          <tr key={o.id} className="hover:bg-slate-50">
            <Td><Link href={`/admin/orders/${o.id}`} className="font-medium text-indigo-600">{o.number}</Link></Td>
            <Td>{o.customer?.companyName ?? "—"}</Td>
            <Td>{o.warehouse.name}</Td>
            <Td right><Money value={o.total} /></Td>
            <Td right><Money value={o.paidAmount} /></Td>
            <Td><Badge tone={ORDER_STATUS[o.status].tone}>{ORDER_STATUS[o.status].label}</Badge></Td>
            <Td><Badge tone={PAYMENT_STATUS[o.paymentStatus].tone}>{PAYMENT_STATUS[o.paymentStatus].label}</Badge></Td>
            <Td className="text-xs">{formatDate(o.createdAt)}</Td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
