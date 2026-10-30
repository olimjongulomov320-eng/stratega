import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePage } from "@/lib/admin";
import { can } from "@/lib/permissions";
import { PageHeader, Card, Table, Td, Badge, Money, LinkButton } from "@/components/admin/ui";
import { ActionButton } from "@/components/admin/forms";
import { formatDate } from "@/lib/format";
import { QUOTE_STATUS } from "@/lib/labels";
import { QuoteForm } from "../quote-form";
import { updateQuotation, setQuotationStatus, quotationToOrder } from "../actions";

export default async function QuotationPage(props: PageProps<"/admin/quotations/[id]">) {
  const session = await requirePage("orders.read");
  const { id } = await props.params;
  const q = await prisma.quotation.findUnique({ where: { id }, include: { customer: true, lines: { include: { product: true } }, order: true, rfqRequest: true } });
  if (!q) notFound();
  const canWrite = can(session.role, "orders.write");
  const editable = canWrite && q.status === "DRAFT";
  const [products, customers] = editable
    ? await Promise.all([
        prisma.product.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true, sku: true, barcode: true, price: true, stock: true } }),
        prisma.customer.findMany({ where: { isActive: true }, orderBy: { companyName: "asc" }, select: { id: true, companyName: true } }),
      ])
    : [[], []];

  return (
    <div>
      <PageHeader
        title={`Taklif ${q.number}`}
        description={<>{q.customer?.companyName ?? "Mijoz tanlanmagan"} · {formatDate(q.createdAt)} · <Badge tone={QUOTE_STATUS[q.status].tone}>{QUOTE_STATUS[q.status].label}</Badge></>}
        back={{ href: "/admin/quotations", label: "Takliflar" }}
        actions={
          <>
            <LinkButton href={`/admin/quotations/${id}/print`} variant="secondary">🖨 Chop etish / PDF</LinkButton>
            {canWrite && q.status === "DRAFT" && <ActionButton action={setQuotationStatus} fields={{ id, status: "SENT" }} variant="secondary" size="md">Yuborildi deb belgilash</ActionButton>}
            {canWrite && !q.order && q.status !== "REJECTED" && <ActionButton action={quotationToOrder} fields={{ id }} variant="primary" size="md" confirm="Taklifdan buyurtma yaratilsinmi?">Buyurtmaga aylantirish</ActionButton>}
            {canWrite && (q.status === "DRAFT" || q.status === "SENT") && <ActionButton action={setQuotationStatus} fields={{ id, status: "REJECTED" }} variant="danger" size="md">Rad etildi</ActionButton>}
          </>
        }
      />
      {q.order && <p className="mb-4 text-sm">Buyurtma: <Link href={`/admin/orders/${q.order.id}`} className="font-semibold text-indigo-600">{q.order.number}</Link></p>}
      {q.rfqRequest && <p className="mb-4 text-sm text-slate-500">Arizadan: {q.rfqRequest.companyName} · {q.rfqRequest.phone}</p>}
      {editable ? (
        <QuoteForm
          action={updateQuotation}
          id={id}
          products={products.map((p) => ({ ...p, available: p.stock }))}
          customers={customers.map((c) => ({ id: c.id, name: c.companyName }))}
          values={{ customerId: q.customerId, note: q.note, validUntil: q.validUntil?.toISOString().slice(0, 10), lines: q.lines.map((l) => ({ productId: l.productId, quantity: l.quantity, price: l.price })) }}
        />
      ) : (
        <Card>
          <Table head={["Mahsulot", "Miqdor", "Narx", "Summa"]}>
            {q.lines.map((l) => (
              <tr key={l.id}><Td>{l.product.name}</Td><Td right>{l.quantity}</Td><Td right><Money value={l.price} /></Td><Td right><Money value={l.price * l.quantity} /></Td></tr>
            ))}
          </Table>
          <p className="mt-3 text-right text-lg font-bold">Jami: <Money value={q.total} /></p>
        </Card>
      )}
    </div>
  );
}
