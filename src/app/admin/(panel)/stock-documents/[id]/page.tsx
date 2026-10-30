import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePage } from "@/lib/admin";
import { can } from "@/lib/permissions";
import { PageHeader, Card, Table, Td, Badge, Money } from "@/components/admin/ui";
import { ActionButton } from "@/components/admin/forms";
import { formatDate } from "@/lib/format";
import { DOC_TYPE, DOC_STATUS } from "@/lib/labels";
import { postDocument, cancelDocument } from "../actions";

export default async function DocPage(props: PageProps<"/admin/stock-documents/[id]">) {
  const session = await requirePage("stock.read");
  const { id } = await props.params;
  const doc = await prisma.stockDocument.findUnique({
    where: { id },
    include: { warehouse: true, targetWarehouse: true, supplier: true, lines: { include: { product: true } } },
  });
  if (!doc) notFound();
  const canWrite = can(session.role, "stock.write");
  const total = doc.lines.reduce((s, l) => s + (l.unitCost ?? 0) * l.quantity, 0);
  return (
    <div>
      <PageHeader
        title={`${DOC_TYPE[doc.type]} · ${doc.number}`}
        description={`${formatDate(doc.createdAt, true)} · ${doc.createdBy ?? ""}`}
        back={{ href: "/admin/stock-documents", label: "Ombor hujjatlari" }}
        actions={
          canWrite && doc.status === "DRAFT" ? (
            <>
              <ActionButton action={postDocument} fields={{ id }} variant="primary" size="md" confirm="Hujjatni o'tkazasizmi? Qoldiqlar o'zgaradi.">O&apos;tkazish</ActionButton>
              <ActionButton action={cancelDocument} fields={{ id }} variant="danger" size="md">Bekor qilish</ActionButton>
            </>
          ) : undefined
        }
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card title="Qatorlar">
          <Table head={["Mahsulot", doc.type === "INVENTORY" ? "Sanalgan miqdor" : "Miqdor", ...(doc.type === "RECEIPT" ? ["Birlik tannarxi", "Summa"] : [])]}>
            {doc.lines.map((l) => (
              <tr key={l.id}>
                <Td><Link href={`/admin/products/${l.productId}/overview`} className="hover:text-indigo-600">{l.product.name}</Link></Td>
                <Td right>{l.quantity}</Td>
                {doc.type === "RECEIPT" && <Td right><Money value={l.unitCost} /></Td>}
                {doc.type === "RECEIPT" && <Td right><Money value={l.unitCost ? l.unitCost * l.quantity : null} /></Td>}
              </tr>
            ))}
          </Table>
          {doc.type === "RECEIPT" && total > 0 && <p className="mt-3 text-right font-semibold">Jami: <Money value={total} /></p>}
        </Card>
        <Card title="Ma'lumot">
          <dl className="space-y-2 text-sm">
            <div><dt className="text-slate-500">Holat</dt><dd><Badge tone={DOC_STATUS[doc.status].tone}>{DOC_STATUS[doc.status].label}</Badge></dd></div>
            <div><dt className="text-slate-500">Ombor</dt><dd>{doc.warehouse.name}{doc.targetWarehouse ? ` → ${doc.targetWarehouse.name}` : ""}</dd></div>
            {doc.supplier && <div><dt className="text-slate-500">Yetkazib beruvchi</dt><dd>{doc.supplier.name}</dd></div>}
            {doc.postedAt && <div><dt className="text-slate-500">O&apos;tkazilgan</dt><dd>{formatDate(doc.postedAt, true)}</dd></div>}
            {doc.note && <div><dt className="text-slate-500">Izoh</dt><dd>{doc.note}</dd></div>}
          </dl>
        </Card>
      </div>
    </div>
  );
}
