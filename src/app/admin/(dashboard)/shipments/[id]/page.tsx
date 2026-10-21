import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePagePermission } from "@/lib/require-permission";
import { ShipmentStatusActions } from "../status-actions";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Qoralama",
  READY: "Tayyor",
  SHIPPED: "Jo'natilgan",
  DELIVERED: "Yetkazilgan",
  CANCELLED: "Bekor qilingan",
};

export default async function ShipmentDetailPage(
  props: PageProps<"/admin/shipments/[id]">
) {
  await requirePagePermission("orders.read");

  const { id } = await props.params;
  const shipment = await prisma.shipment.findUnique({
    where: { id },
    include: {
      order: {
        include: {
          customer: { select: { companyName: true } },
          items: { include: { product: { select: { name: true, sku: true } } } },
        },
      },
      warehouse: { select: { name: true } },
      responsible: { select: { name: true } },
      items: { include: { product: { select: { name: true, sku: true, unit: true } } } },
    },
  });
  if (!shipment) notFound();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{shipment.number}</h1>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
              {STATUS_LABELS[shipment.status] ?? shipment.status}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Buyurtma:{" "}
            <Link
              href={`/admin/orders/${shipment.orderId}`}
              className="font-medium text-indigo-600 hover:underline"
            >
              {shipment.order.number}
            </Link>
            {" · "}
            {shipment.order.customer?.companyName ?? "Mijozsiz"}
            {" · "}
            {shipment.warehouse?.name ?? "Omborsiz"}
            {shipment.responsible && <> · Mas&apos;ul: {shipment.responsible.name}</>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ShipmentStatusActions id={shipment.id} status={shipment.status} />
          <Link
            href="/admin/shipments"
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            ← Orqaga
          </Link>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Mahsulot</th>
              <th className="px-4 py-3 text-right">Buyurtmadagi miqdor</th>
              <th className="px-4 py-3 text-right">Jo&apos;natilmoqda</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {shipment.items.map((item) => {
              const orderItem = shipment.order.items.find(
                (i) => i.productId === item.productId
              );
              return (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <span className="font-medium text-slate-800">
                      {item.product.name}
                    </span>
                    {item.product.sku && (
                      <span className="ml-2 text-xs text-slate-400">{item.product.sku}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-600">
                    {orderItem?.quantity ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-900">
                    {item.quantity}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {shipment.note && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-700">Izoh</h2>
          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">
            {shipment.note}
          </p>
        </div>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Yaratilgan</p>
          <p className="mt-1 text-sm font-semibold text-slate-800">
            {shipment.createdAt.toLocaleString("uz-UZ")}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Jo&apos;natilgan</p>
          <p className="mt-1 text-sm font-semibold text-slate-800">
            {shipment.shippedAt ? shipment.shippedAt.toLocaleString("uz-UZ") : "—"}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Yetkazilgan</p>
          <p className="mt-1 text-sm font-semibold text-slate-800">
            {shipment.deliveredAt ? shipment.deliveredAt.toLocaleString("uz-UZ") : "—"}
          </p>
        </div>
      </div>
    </div>
  );
}
