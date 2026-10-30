import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePage } from "@/lib/admin";
import { can } from "@/lib/permissions";
import { PageHeader, Card, Table, Td, Badge, Field, inputCls } from "@/components/admin/ui";
import { ActionForm, ActionButton, Submit } from "@/components/admin/forms";
import { formatDate } from "@/lib/format";
import { SHIPMENT_STATUS } from "@/lib/labels";
import { shipShipment } from "../../orders/actions";

export default async function ShipmentPage(props: PageProps<"/admin/shipments/[id]">) {
  const session = await requirePage("orders.read");
  const { id } = await props.params;
  const s = await prisma.shipment.findUnique({ where: { id }, include: { order: { include: { customer: true } }, warehouse: true, lines: { include: { product: true } } } });
  if (!s) notFound();
  const canShip = can(session.role, "stock.write");
  return (
    <div>
      <PageHeader
        title={`Jo'natma ${s.number}`}
        description={<>Buyurtma <Link href={`/admin/orders/${s.orderId}`} className="text-indigo-600">{s.order.number}</Link> · {s.order.customer?.companyName ?? "—"} · {s.warehouse.name}</>}
        back={{ href: "/admin/shipments", label: "Jo'natmalar" }}
        actions={
          <>
            <Badge tone={SHIPMENT_STATUS[s.status].tone}>{SHIPMENT_STATUS[s.status].label}</Badge>
            {canShip && (s.status === "DRAFT" || s.status === "READY") && (
              <ActionButton action={shipShipment} fields={{ id, to: "SHIPPED" }} variant="primary" size="md" confirm="Jo'natilsinmi? Mahsulotlar ombordan chiqariladi.">Jo&apos;natildi (ombordan chiqarish)</ActionButton>
            )}
            {canShip && s.status === "SHIPPED" && <ActionButton action={shipShipment} fields={{ id, to: "DELIVERED" }} variant="primary" size="md">Yetkazildi</ActionButton>}
            {canShip && (s.status === "DRAFT" || s.status === "READY") && <ActionButton action={shipShipment} fields={{ id, to: "CANCELLED" }} variant="danger" size="md">Bekor qilish</ActionButton>}
          </>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card title="Pozitsiyalar">
          <Table head={["Mahsulot", "SKU", "Miqdor"]}>
            {s.lines.map((l) => (
              <tr key={l.id}><Td>{l.product.name}</Td><Td>{l.product.sku ?? "—"}</Td><Td right>{l.quantity}</Td></tr>
            ))}
          </Table>
        </Card>
        <Card title="Ma'lumot">
          <dl className="space-y-2 text-sm">
            <div><dt className="text-slate-500">Yaratilgan</dt><dd>{formatDate(s.createdAt, true)}</dd></div>
            {s.shippedAt && <div><dt className="text-slate-500">Jo&apos;natilgan</dt><dd>{formatDate(s.shippedAt, true)}</dd></div>}
            {s.deliveredAt && <div><dt className="text-slate-500">Yetkazilgan</dt><dd>{formatDate(s.deliveredAt, true)}</dd></div>}
            {s.address && <div><dt className="text-slate-500">Manzil</dt><dd>{s.address}</dd></div>}
            <div><dt className="text-slate-500">Mas&apos;ul</dt><dd>{s.assignee ?? "—"}</dd></div>
          </dl>
          {canShip && s.status === "DRAFT" && (
            <ActionForm action={shipShipment} className="mt-4 flex flex-col gap-2">
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="to" value="READY" />
              <Field label="Mas'ul (haydovchi / omborchi)"><input name="assignee" className={inputCls} /></Field>
              <Submit size="sm" variant="secondary">Tayyor deb belgilash</Submit>
            </ActionForm>
          )}
        </Card>
      </div>
    </div>
  );
}
