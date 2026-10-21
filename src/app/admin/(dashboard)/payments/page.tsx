import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatSum } from "@/lib/format";
import { requirePagePermission } from "@/lib/require-permission";
import { CsvExportButton } from "@/components/csv-export-button";
import { RecordPaymentButton } from "./record-button";
import { RefundPaymentButton } from "./refund-button";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Kutilmoqda",
  PARTIAL: "Qisman to'langan",
  PAID: "To'langan",
  REFUNDED: "Qaytarilgan",
};

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  PARTIAL: "bg-sky-50 text-sky-700",
  PAID: "bg-emerald-50 text-emerald-700",
  REFUNDED: "bg-rose-50 text-rose-700",
};

export default async function PaymentsPage(props: PageProps<"/admin/payments">) {
  await requirePagePermission("finance.read");

  const sp = await props.searchParams;
  const statusFilter = typeof sp.status === "string" ? sp.status : "";

  const [payments, orders, summary] = await Promise.all([
    prisma.payment.findMany({
      where: statusFilter ? { status: statusFilter as never } : undefined,
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        order: {
          select: {
            id: true,
            number: true,
            customer: { select: { companyName: true } },
            items: { select: { price: true, quantity: true } },
          },
        },
        customer: { select: { companyName: true } },
      },
    }),
    // To'lov qabul qilish uchun ochiq buyurtmalar ro'yxati.
    prisma.order.findMany({
      where: { status: { notIn: ["DRAFT", "CANCELLED"] } },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        number: true,
        customer: { select: { companyName: true } },
        items: { select: { price: true, quantity: true } },
        payments: { select: { amount: true, status: true } },
      },
    }),
    prisma.payment.aggregate({
      where: { status: { in: ["PENDING", "PARTIAL", "PAID"] } },
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  const receivedSum = summary._sum.amount ?? 0;

  // Buyurtma bo'yicha to'lov holatini hisoblaymiz.
  const orderSummaries = orders
    .map((o) => {
      const total = o.items.reduce((s, i) => s + i.price * i.quantity, 0);
      const paid = o.payments
        .filter((p) => p.status !== "REFUNDED")
        .reduce((s, p) => s + p.amount, 0);
      return { ...o, total, paid, outstanding: total - paid };
    })
    .sort((a, b) => b.outstanding - a.outstanding);

  const openOrders = orderSummaries.filter((o) => o.outstanding > 0);
  const totalOutstanding = openOrders.reduce((s, o) => s + o.outstanding, 0);

  const tabs = [
    { value: "", label: "Barchasi" },
    { value: "PENDING", label: "Kutilmoqda" },
    { value: "PARTIAL", label: "Qisman" },
    { value: "PAID", label: "To'langan" },
    { value: "REFUNDED", label: "Qaytarilgan" },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">To&apos;lovlar</h1>
          <p className="mt-1 text-slate-500">
            Buyurtmalar bo&apos;ycha tushumlar, qarz va qaytarishlar.
          </p>
        </div>
        <CsvExportButton
          filename="tolovlar"
          header={["Buyurtma", "Mijoz", "Summa", "Holat", "Usul", "Sana"]}
          rows={payments.map((p) => [
            p.order.number,
            p.customer?.companyName ?? p.order.customer?.companyName ?? "",
            String(p.amount),
            STATUS_LABELS[p.status] ?? p.status,
            p.method ?? "",
            (p.receivedAt ?? p.createdAt).toLocaleDateString("uz-UZ"),
          ])}
        />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-2xl font-black text-slate-900">{formatSum(receivedSum)}</p>
          <p className="mt-1 text-sm text-slate-500">
            Jami qabul qilingan ({summary._count} ta)
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-2xl font-black text-rose-600">{formatSum(totalOutstanding)}</p>
          <p className="mt-1 text-sm text-slate-500">
            Qarzdorlik ({openOrders.length} ta buyurtma)
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-2xl font-black text-slate-900">
            {payments.filter((p) => p.status === "PENDING").length}
          </p>
          <p className="mt-1 text-sm text-slate-500">Tasdiqlanmagan to&apos;lovlar</p>
        </div>
      </div>

      {/* To'lov qabul qilish */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">To&apos;lov qabul qilish</h2>
            <p className="text-sm text-slate-500">
              Buyurtmani tanlang va tushumni qayd eting — holat avtomatik hisoblanadi.
            </p>
          </div>
          <RecordPaymentButton
            orders={openOrders.map((o) => ({
              id: o.id,
              label: `${o.number}${o.customer?.companyName ? ` — ${o.customer.companyName}` : ""}`,
              outstanding: o.outstanding,
            }))}
          />
        </div>
      </div>

      {/* Filtr tablari */}
      <div className="mt-6 flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const active = statusFilter === tab.value;
          return (
            <Link
              key={tab.value}
              href={tab.value ? `/admin/payments?status=${tab.value}` : "/admin/payments"}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                active
                  ? "bg-slate-900 text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* To'lovlar jadvali */}
      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Sana</th>
              <th className="px-4 py-3">Buyurtma</th>
              <th className="px-4 py-3">Mijoz</th>
              <th className="px-4 py-3 text-right">Summa</th>
              <th className="px-4 py-3">Holat</th>
              <th className="px-4 py-3">Usul</th>
              <th className="px-4 py-3">Amallar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {payments.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                  To&apos;lovlar yo&apos;q.
                </td>
              </tr>
            )}
            {payments.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                  {(p.receivedAt ?? p.createdAt).toLocaleString("uz-UZ")}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/orders/${p.orderId}`}
                    className="font-medium text-indigo-600 hover:underline"
                  >
                    {p.order.number}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {p.customer?.companyName ?? p.order.customer?.companyName ?? "—"}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-slate-900">
                  {formatSum(p.amount)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      STATUS_STYLE[p.status] ?? "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {STATUS_LABELS[p.status] ?? p.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">{p.method ?? "—"}</td>
                <td className="px-4 py-3">
                  {p.status !== "REFUNDED" ? (
                    <RefundPaymentButton id={p.id} />
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
