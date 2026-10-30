import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePage } from "@/lib/admin";
import { can } from "@/lib/permissions";
import { PageHeader, Card, Table, Td, Badge, Money, Field, inputCls, Stat } from "@/components/admin/ui";
import { ActionForm, ActionButton, Submit } from "@/components/admin/forms";
import { formatDate } from "@/lib/format";
import { ORDER_STATUS, PAYMENT_STATUS, SHIPMENT_STATUS, PAYMENT_METHOD, PAYMENT_RECORD_STATUS } from "@/lib/labels";
import { OrderForm } from "../order-form";
import { orderFormData } from "../data";
import { updateOrderLines, confirmOrder, cancelOrder, completeOrder, createShipment, recordPayment, deletePayment } from "../actions";

export default async function OrderPage(props: PageProps<"/admin/orders/[id]">) {
  const session = await requirePage("orders.read");
  const { id } = await props.params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { customer: true, warehouse: true, quotation: true, lines: { include: { product: true } }, shipments: { include: { lines: true }, orderBy: { createdAt: "asc" } }, payments: { orderBy: { paidAt: "desc" } } },
  });
  if (!order) notFound();
  const canWrite = can(session.role, "orders.write");
  const canFinance = can(session.role, "finance.read");
  const canPay = can(session.role, "finance.write");
  const canShip = can(session.role, "stock.write");
  const editable = canWrite && order.status === "DRAFT";
  const formData = editable ? await orderFormData() : null;

  const cost = order.lines.reduce((s, l) => s + (l.costPrice ?? 0) * l.quantity, 0);
  const missingCost = order.lines.some((l) => !l.costPrice);
  const net = order.total / 1.12;
  const profit = net - cost;
  const debt = order.total - order.paidAmount;
  const shipped = new Map<string, number>();
  for (const s of order.shipments.filter((s) => s.status !== "CANCELLED")) for (const l of s.lines) shipped.set(l.productId, (shipped.get(l.productId) ?? 0) + l.quantity);
  const unshipped = order.lines.some((l) => l.quantity > (shipped.get(l.productId) ?? 0));

  return (
    <div>
      <PageHeader
        title={`Buyurtma ${order.number}`}
        description={<>{order.customer ? <Link href={`/admin/customers/${order.customer.id}`} className="text-indigo-600">{order.customer.companyName}</Link> : "Mijoz tanlanmagan"} · {order.warehouse.name} · {formatDate(order.createdAt, true)}</>}
        back={{ href: "/admin/orders", label: "Buyurtmalar" }}
        actions={
          <>
            <Badge tone={ORDER_STATUS[order.status].tone}>{ORDER_STATUS[order.status].label}</Badge>
            <Badge tone={PAYMENT_STATUS[order.paymentStatus].tone}>{PAYMENT_STATUS[order.paymentStatus].label}</Badge>
            {canWrite && order.status === "DRAFT" && <ActionButton action={confirmOrder} fields={{ id }} variant="primary" size="md" confirm="Buyurtmani tasdiqlaysizmi? Mahsulotlar band qilinadi.">Tasdiqlash (band qilish)</ActionButton>}
            {canShip && order.status === "CONFIRMED" && unshipped && <ActionButton action={createShipment} fields={{ id }} variant="primary" size="md">Jo&apos;natma yaratish</ActionButton>}
            {canWrite && order.status === "SHIPPED" && <ActionButton action={completeOrder} fields={{ id }} variant="secondary" size="md">Yakunlash</ActionButton>}
            {canWrite && (order.status === "DRAFT" || order.status === "CONFIRMED") && <ActionButton action={cancelOrder} fields={{ id }} variant="danger" size="md" confirm="Buyurtmani bekor qilasizmi? Band qilingan mahsulotlar bo'shatiladi.">Bekor qilish</ActionButton>}
          </>
        }
      />
      {order.quotation && <p className="mb-4 text-sm text-slate-500">Taklifdan: <Link href={`/admin/quotations/${order.quotation.id}`} className="text-indigo-600">{order.quotation.number}</Link></p>}

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Summa (QQS bilan)" value={<Money value={order.total} />} />
        {canFinance && <Stat label="To'langan" value={<Money value={order.paidAmount} />} />}
        {canFinance && <Stat label="Qarz" value={<Money value={debt} />} tone={debt > 0 && order.status !== "DRAFT" ? "warn" : "default"} />}
        {canFinance && <Stat label="Sof foyda (QQSsiz)" value={<Money value={Math.round(profit)} />} hint={missingCost ? "Ba'zi mahsulotlarda tannarx yo'q" : `${net > 0 ? Math.round((profit / net) * 100) : 0}% marja`} />}
      </div>

      {editable && formData ? (
        <OrderForm
          action={updateOrderLines}
          id={id}
          {...formData}
          values={{ customerId: order.customerId, warehouseId: order.warehouseId, note: order.note, lines: order.lines.map((l) => ({ productId: l.productId, quantity: l.quantity, price: l.price })) }}
        />
      ) : (
        <Card title="Mahsulotlar">
          <Table head={["Mahsulot", "Miqdor", "Jo'natilgan", "Narx", "Summa", ...(canFinance ? ["Tannarx"] : [])]}>
            {order.lines.map((l) => (
              <tr key={l.id}>
                <Td><Link href={`/admin/products/${l.productId}/overview`} className="hover:text-indigo-600">{l.product.name}</Link></Td>
                <Td right>{l.quantity}</Td>
                <Td right>{shipped.get(l.productId) ?? 0}</Td>
                <Td right><Money value={l.price} /></Td>
                <Td right><Money value={l.price * l.quantity} /></Td>
                {canFinance && <Td right><Money value={l.costPrice} /></Td>}
              </tr>
            ))}
          </Table>
          {order.note && <p className="mt-3 text-sm text-slate-500">Izoh: {order.note}</p>}
        </Card>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card title="Jo'natmalar">
          <Table head={["Raqam", "Holat", "Pozitsiyalar", "Sana"]} empty="Jo'natmalar yo'q.">
            {order.shipments.map((s) => (
              <tr key={s.id}>
                <Td><Link href={`/admin/shipments/${s.id}`} className="text-indigo-600">{s.number}</Link></Td>
                <Td><Badge tone={SHIPMENT_STATUS[s.status].tone}>{SHIPMENT_STATUS[s.status].label}</Badge></Td>
                <Td right>{s.lines.reduce((a, l) => a + l.quantity, 0)}</Td>
                <Td className="text-xs">{formatDate(s.createdAt)}</Td>
              </tr>
            ))}
          </Table>
        </Card>
        {canFinance && (
          <Card title="To'lovlar">
            <Table head={["Sana", "Summa", "Usul", "Holat", "Izoh", ""]} empty="To'lovlar yo'q.">
              {order.payments.map((p) => (
                <tr key={p.id}>
                  <Td className="text-xs">{formatDate(p.paidAt)}</Td>
                  <Td right><Money value={p.status === "REFUNDED" ? -p.amount : p.amount} /></Td>
                  <Td>{PAYMENT_METHOD[p.method]}</Td>
                  <Td><Badge tone={PAYMENT_RECORD_STATUS[p.status].tone}>{PAYMENT_RECORD_STATUS[p.status].label}</Badge></Td>
                  <Td className="text-xs">{[p.reference, p.note].filter(Boolean).join(" · ") || "—"}</Td>
                  <Td right>{canPay && <ActionButton action={deletePayment} fields={{ id: p.id }} variant="ghost" confirm="To'lovni o'chirasizmi?">✕</ActionButton>}</Td>
                </tr>
              ))}
            </Table>
            {canPay && order.status !== "DRAFT" && order.status !== "CANCELLED" && (
              <ActionForm action={recordPayment} resetOnSuccess className="mt-4 grid gap-3 sm:grid-cols-3">
                <input type="hidden" name="orderId" value={id} />
                <Field label="Summa (so'm)"><input name="amount" required inputMode="numeric" defaultValue={debt > 0 ? debt : ""} className={inputCls} /></Field>
                <Field label="Usul">
                  <select name="method" className={inputCls}>{Object.entries(PAYMENT_METHOD).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
                </Field>
                <Field label="Sana"><input type="date" name="paidAt" className={inputCls} /></Field>
                <Field label="To'lov hujjati №"><input name="reference" className={inputCls} /></Field>
                <Field label="Turi">
                  <select name="kind" className={inputCls}><option value="payment">To&apos;lov</option><option value="refund">Qaytarish</option></select>
                </Field>
                <div className="self-end"><Submit size="sm">Qayd etish</Submit></div>
              </ActionForm>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
