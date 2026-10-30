import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePage } from "@/lib/admin";
import { can } from "@/lib/permissions";
import { PageHeader, Table, Td, Badge, Money, LinkButton, DownloadLink } from "@/components/admin/ui";
import { formatDate } from "@/lib/format";
import { QUOTE_STATUS } from "@/lib/labels";

export default async function QuotationsPage() {
  const session = await requirePage("orders.read");
  const quotes = await prisma.quotation.findMany({ orderBy: { createdAt: "desc" }, take: 200, include: { customer: true, order: true } });
  return (
    <div>
      <PageHeader
        title="Takliflar (KP)"
        description="Mijozlarga narx taklifi — arizadan keyingi bosqich."
        actions={<><DownloadLink href="/api/admin/export?type=quotations">CSV yuklab olish</DownloadLink>{can(session.role, "orders.write") && <LinkButton href="/admin/quotations/new">+ Yangi taklif</LinkButton>}</>}
      />
      <Table head={["Raqam", "Mijoz", "Summa", "Holat", "Amal qiladi", "Buyurtma"]} empty="Takliflar yo'q. Arizalar sahifasidan yarating.">
        {quotes.map((q) => {
          const expired = q.validUntil && q.validUntil < new Date() && (q.status === "DRAFT" || q.status === "SENT");
          return (
            <tr key={q.id} className="hover:bg-slate-50">
              <Td><Link href={`/admin/quotations/${q.id}`} className="font-medium text-indigo-600">{q.number}</Link><div className="text-xs text-slate-400">{formatDate(q.createdAt)}</div></Td>
              <Td>{q.customer?.companyName ?? "—"}</Td>
              <Td right><Money value={q.total} /></Td>
              <Td><Badge tone={QUOTE_STATUS[q.status].tone}>{QUOTE_STATUS[q.status].label}</Badge></Td>
              <Td className={expired ? "text-red-600" : ""}>{q.validUntil ? formatDate(q.validUntil) : "—"}</Td>
              <Td>{q.order ? <Link href={`/admin/orders/${q.order.id}`} className="text-indigo-600">{q.order.number}</Link> : "—"}</Td>
            </tr>
          );
        })}
      </Table>
    </div>
  );
}
