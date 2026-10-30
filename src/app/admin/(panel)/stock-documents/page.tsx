import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePage } from "@/lib/admin";
import { PageHeader, Table, Td, Badge, LinkButton } from "@/components/admin/ui";
import { formatDate } from "@/lib/format";
import { DOC_TYPE, DOC_STATUS } from "@/lib/labels";

export default async function DocsPage() {
  await requirePage("stock.read");
  const docs = await prisma.stockDocument.findMany({ orderBy: { createdAt: "desc" }, take: 200, include: { warehouse: true, targetWarehouse: true, supplier: true, _count: { select: { lines: true } } } });
  return (
    <div>
      <PageHeader title="Ombor hujjatlari" description="Kirim, chiqim, ko'chirish, hisobdan chiqarish va inventarizatsiya." actions={<LinkButton href="/admin/stock-documents/new">+ Yangi hujjat</LinkButton>} />
      <Table head={["Raqam", "Turi", "Ombor", "Yetkazib beruvchi", "Qatorlar", "Holat", "Sana"]} empty="Hozircha hujjatlar yo'q.">
        {docs.map((d) => (
          <tr key={d.id} className="hover:bg-slate-50">
            <Td><Link href={`/admin/stock-documents/${d.id}`} className="font-medium text-indigo-600">{d.number}</Link></Td>
            <Td>{DOC_TYPE[d.type]}</Td>
            <Td>{d.warehouse.name}{d.targetWarehouse ? ` → ${d.targetWarehouse.name}` : ""}</Td>
            <Td>{d.supplier?.name ?? "—"}</Td>
            <Td right>{d._count.lines}</Td>
            <Td><Badge tone={DOC_STATUS[d.status].tone}>{DOC_STATUS[d.status].label}</Badge></Td>
            <Td className="text-xs">{formatDate(d.createdAt, true)}</Td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
