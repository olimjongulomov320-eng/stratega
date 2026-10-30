import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePage } from "@/lib/admin";
import { PageHeader, Table, Td, Badge, Filters, inputCls, btn, DownloadLink } from "@/components/admin/ui";
import { formatDate } from "@/lib/format";
import { SHIPMENT_STATUS } from "@/lib/labels";
import type { ShipmentStatus } from "@/generated/prisma/client";

export default async function ShipmentsPage(props: PageProps<"/admin/shipments">) {
  await requirePage("orders.read");
  const sp = await props.searchParams;
  const status = typeof sp.status === "string" && sp.status in SHIPMENT_STATUS ? (sp.status as ShipmentStatus) : undefined;
  const shipments = await prisma.shipment.findMany({
    where: status ? { status } : {},
    orderBy: { createdAt: "desc" },
    take: 300,
    include: { order: { include: { customer: true } }, warehouse: true, lines: true },
  });
  return (
    <div>
      <PageHeader title="Jo'natmalar" description="Buyurtmalarning ombor qismi — tayyorlash, jo'natish va yetkazish." actions={<DownloadLink href="/api/admin/export?type=shipments">CSV yuklab olish</DownloadLink>} />
      <Filters>
        <select name="status" defaultValue={status ?? ""} className={`${inputCls} max-w-xs`}>
          <option value="">Barchasi</option>
          {Object.entries(SHIPMENT_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <button className={btn("secondary")}>Ko&apos;rsatish</button>
      </Filters>
      <Table head={["Raqam", "Buyurtma", "Mijoz", "Ombor", "Birliklar", "Holat", "Mas'ul", "Sana"]} empty="Jo'natmalar yo'q. Buyurtma sahifasidan yarating.">
        {shipments.map((s) => (
          <tr key={s.id} className="hover:bg-slate-50">
            <Td><Link href={`/admin/shipments/${s.id}`} className="font-medium text-indigo-600">{s.number}</Link></Td>
            <Td><Link href={`/admin/orders/${s.orderId}`} className="hover:text-indigo-600">{s.order.number}</Link></Td>
            <Td>{s.order.customer?.companyName ?? "—"}</Td>
            <Td>{s.warehouse.name}</Td>
            <Td right>{s.lines.reduce((a, l) => a + l.quantity, 0)}</Td>
            <Td><Badge tone={SHIPMENT_STATUS[s.status].tone}>{SHIPMENT_STATUS[s.status].label}</Badge></Td>
            <Td>{s.assignee ?? "—"}</Td>
            <Td className="text-xs">{formatDate(s.createdAt)}</Td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
