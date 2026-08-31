import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { formatSum } from "@/lib/format";
import { OrderStatusSelect } from "../order-status-select";

export const dynamic = "force-dynamic";

const TIMELINE_STEPS = [
  "DRAFT",
  "CONFIRMED",
  "PROCESSING",
  "READY_TO_SHIP",
  "SHIPPED",
  "COMPLETED",
] as const;

const STEP_LABELS: Record<string, string> = {
  DRAFT: "Yaratildi",
  CONFIRMED: "Tasdiqlandi",
  PROCESSING: "Tayyorlanmoqda",
  READY_TO_SHIP: "Jo'natishga tayyor",
  SHIPPED: "Jo'natildi",
  COMPLETED: "Yakunlandi",
};

export default async function OrderDetailPage(
  props: PageProps<"/admin/orders/[id]">
) {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const { id } = await props.params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: true,
      warehouse: true,
      items: { include: { product: { select: { name: true, sku: true } } } },
    },
  });
  if (!order) notFound();

  const total = order.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const totalCost = order.items.reduce(
    (s, i) => s + (i.costPrice ?? 0) * i.quantity,
    0
  );
  const grossProfit = total - totalCost;

  const isCancelled = order.status === "CANCELLED";
  const currentStepIndex = TIMELINE_STEPS.indexOf(
    order.status as (typeof TIMELINE_STEPS)[number]
  );

  return (
    <div>
      <Link
        href="/admin/orders"
        className="text-sm font-medium text-indigo-600 hover:underline"
      >
        ← Buyurtmalarga qaytish
      </Link>

      <div className="mt-3 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{order.number}</h1>
          <p className="mt-1 text-slate-500">
            {order.customer?.companyName ?? "Mijozsiz"} ·{" "}
            {order.warehouse?.name ?? "—"}
          </p>
        </div>
        <OrderStatusSelect orderId={order.id} status={order.status} />
      </div>

      {!isCancelled && (
        <div className="mt-6 flex items-center gap-2 overflow-x-auto rounded-xl border border-slate-200 bg-white p-4">
          {TIMELINE_STEPS.map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <div
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
                  i <= currentStepIndex
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {STEP_LABELS[step]}
              </div>
              {i < TIMELINE_STEPS.length - 1 && (
                <div
                  className={`h-0.5 w-6 shrink-0 ${
                    i < currentStepIndex ? "bg-indigo-600" : "bg-slate-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {order.note && (
        <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
          {order.note}
        </p>
      )}

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Mahsulot</th>
              <th className="px-4 py-3">Miqdor</th>
              <th className="px-4 py-3">Narx</th>
              <th className="px-4 py-3">Jami</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {order.items.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-800">
                    {item.product.name}
                  </p>
                  {item.product.sku && (
                    <p className="text-xs text-slate-400">{item.product.sku}</p>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600">{item.quantity}</td>
                <td className="px-4 py-3 text-slate-600">
                  {formatSum(item.price)}
                </td>
                <td className="px-4 py-3 font-medium text-slate-800">
                  {formatSum(item.price * item.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-400">Jami summa</p>
          <p className="mt-1 text-lg font-bold text-slate-900">
            {formatSum(total)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-400">Tannarx</p>
          <p className="mt-1 text-lg font-bold text-slate-900">
            {formatSum(totalCost)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-400">Yalpi foyda</p>
          <p
            className={`mt-1 text-lg font-bold ${
              grossProfit >= 0 ? "text-emerald-600" : "text-rose-600"
            }`}
          >
            {formatSum(grossProfit)}
          </p>
        </div>
      </div>
    </div>
  );
}
