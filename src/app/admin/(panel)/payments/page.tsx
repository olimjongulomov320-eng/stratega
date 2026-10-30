import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePage } from "@/lib/admin";
import { can } from "@/lib/permissions";
import { PageHeader, Table, Td, Badge, Money, Stat, Card, Field, inputCls, Filters, btn, DownloadLink } from "@/components/admin/ui";
import { ActionForm, Submit } from "@/components/admin/forms";
import { formatDate, daysAgo } from "@/lib/format";
import { PAYMENT_METHOD, PAYMENT_RECORD_STATUS, PAYMENT_STATUS } from "@/lib/labels";
import { recordPayment } from "../orders/actions";
import { getSetting } from "@/lib/settings";
import type { PaymentStatus } from "@/generated/prisma/client";

export default async function PaymentsPage(props: PageProps<"/admin/payments">) {
  const session = await requirePage("finance.read");
  const sp = await props.searchParams;
  const ps = typeof sp.status === "string" && sp.status in PAYMENT_STATUS ? (sp.status as PaymentStatus) : undefined;
  const overdueDays = await getSetting<number>("finance.paymentOverdueDays");
  const [payments, open, received] = await Promise.all([
    prisma.payment.findMany({ orderBy: { paidAt: "desc" }, take: 300, include: { order: { include: { customer: true } } } }),
    prisma.order.findMany({
      where: { status: { in: ["CONFIRMED", "SHIPPED", "COMPLETED"] }, ...(ps ? { paymentStatus: ps } : { paymentStatus: { in: ["UNPAID", "PARTIAL"] } }) },
      orderBy: { confirmedAt: "asc" },
      include: { customer: true },
    }),
    prisma.payment.aggregate({ where: { status: "CONFIRMED" }, _sum: { amount: true }, _count: true }),
  ]);
  const debt = open.reduce((s, o) => s + o.total - o.paidAmount, 0);
  const overdueLimit = daysAgo(overdueDays).getTime();
  const overdue = open.filter((o) => o.confirmedAt && o.confirmedAt.getTime() < overdueLimit && o.total > o.paidAmount);
  return (
    <div>
      <PageHeader title="To'lovlar" description="Buyurtmalar bo'yicha tushumlar, qarzdorlik va qaytarishlar." actions={<DownloadLink href="/api/admin/export?type=payments">CSV yuklab olish</DownloadLink>} />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Stat label={`Jami qabul qilingan (${received._count} ta)`} value={<Money value={received._sum.amount ?? 0} />} />
        <Stat label={`Qarzdorlik (${open.length} ta buyurtma)`} value={<Money value={debt} />} tone={debt > 0 ? "warn" : "default"} />
        <Stat label={`Kechikkan (${overdueDays}+ kun)`} value={overdue.length} tone={overdue.length > 0 ? "bad" : "good"} />
      </div>
      {can(session.role, "finance.write") && open.length > 0 && (
        <Card title="To'lov qabul qilish" className="mb-6">
          <ActionForm action={recordPayment} resetOnSuccess className="grid gap-3 sm:grid-cols-5">
            <Field label="Buyurtma" className="sm:col-span-2">
              <select name="orderId" className={inputCls}>
                {open.map((o) => <option key={o.id} value={o.id}>{o.number} — {o.customer?.companyName ?? "—"} — qarz {(o.total - o.paidAmount).toLocaleString("ru-RU")}</option>)}
              </select>
            </Field>
            <Field label="Summa"><input name="amount" required inputMode="numeric" className={inputCls} /></Field>
            <Field label="Usul"><select name="method" className={inputCls}>{Object.entries(PAYMENT_METHOD).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
            <Field label="To'lov hujjati №"><input name="reference" className={inputCls} /></Field>
            <div className="sm:col-span-5"><Submit size="sm">Qayd etish</Submit></div>
          </ActionForm>
        </Card>
      )}
      <h2 className="mb-2 font-semibold text-slate-800">Qarzdor buyurtmalar</h2>
      <Filters>
        <select name="status" defaultValue={ps ?? ""} className={`${inputCls} max-w-xs`}>
          <option value="">To&apos;lanmagan va qisman</option>
          {Object.entries(PAYMENT_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <button className={btn("secondary")}>Ko&apos;rsatish</button>
      </Filters>
      <Table head={["Buyurtma", "Mijoz", "Tasdiqlangan", "Summa", "To'langan", "Qarz", "Holat"]} empty="Qarzdorlik yo'q.">
        {open.map((o) => (
          <tr key={o.id} className={overdue.includes(o) ? "bg-red-50/50" : ""}>
            <Td><Link href={`/admin/orders/${o.id}`} className="text-indigo-600">{o.number}</Link></Td>
            <Td>{o.customer?.companyName ?? "—"}</Td>
            <Td className="text-xs">{o.confirmedAt ? formatDate(o.confirmedAt) : "—"}</Td>
            <Td right><Money value={o.total} /></Td>
            <Td right><Money value={o.paidAmount} /></Td>
            <Td right><Money value={o.total - o.paidAmount} /></Td>
            <Td><Badge tone={PAYMENT_STATUS[o.paymentStatus].tone}>{PAYMENT_STATUS[o.paymentStatus].label}</Badge></Td>
          </tr>
        ))}
      </Table>
      <h2 className="mb-2 mt-8 font-semibold text-slate-800">To&apos;lovlar tarixi</h2>
      <Table head={["Sana", "Buyurtma", "Mijoz", "Summa", "Usul", "Holat", "Hujjat"]} empty="To'lovlar yo'q.">
        {payments.map((p) => (
          <tr key={p.id}>
            <Td className="text-xs">{formatDate(p.paidAt)}</Td>
            <Td><Link href={`/admin/orders/${p.orderId}`} className="text-indigo-600">{p.order.number}</Link></Td>
            <Td>{p.order.customer?.companyName ?? "—"}</Td>
            <Td right><Money value={p.status === "REFUNDED" ? -p.amount : p.amount} /></Td>
            <Td>{PAYMENT_METHOD[p.method]}</Td>
            <Td><Badge tone={PAYMENT_RECORD_STATUS[p.status].tone}>{PAYMENT_RECORD_STATUS[p.status].label}</Badge></Td>
            <Td className="text-xs">{p.reference ?? "—"}</Td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
