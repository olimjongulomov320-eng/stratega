import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePagePermission } from "@/lib/require-permission";
import { CsvExportButton } from "@/components/csv-export-button";
import { ShipmentStatusActions } from "./status-actions";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Qoralama",
  READY: "Tayyor",
  SHIPPED: "Jo'natilgan",
  DELIVERED: "Yetkazilgan",
  CANCELLED: "Bekor qilingan",
};

const STATUS_STYLE: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  READY: "bg-indigo-50 text-indigo-700",
  SHIPPED: "bg-amber-50 text-amber-700",
  DELIVERED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-rose-50 text-rose-700",
};

export default async function ShipmentsPage(
  props: PageProps<"/admin/shipments">
) {
  await requirePagePermission("orders.read");

  const sp = await props.searchParams;
  const statusFilter = typeof sp.status === "string" ? sp.status : "";

  const shipments = await prisma.shipment.findMany({
    where: statusFilter ? { status: statusFilter as never } : undefined,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      order: {
        select: {
          id: true,
          number: true,
          status: true,
          customer: { select: { companyName: true } },
        },
      },
      warehouse: { select: { name: true } },
      responsible: { select: { name: true } },
      items: { select: { quantity: true } },
    },
  });

  const tabs = [
    { value: "", label: "Barchasi" },
    { value: "DRAFT", label: "Qoralama" },
    { value: "READY", label: "Tayyor" },
    { value: "SHIPPED", label: "Jo'natilgan" },
    { value: "DELIVERED", label: "Yetkazilgan" },
    { value: "CANCELLED", label: "Bekor qilingan" },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Jo&apos;natmalar</h1>
          <p className="mt-1 text-slate-500">
            Buyurtmalarning ombor qismi — tayyorlash, jo&apos;natish va yetkazish.
          </p>
        </div>
        <CsvExportButton
          filename="jontmalar"
          header={["Raqam", "Buyurtma", "Mijoz", "Ombor", "Miqdor", "Holat", "Sana"]}
          rows={shipments.map((s) => [
            s.number,
            s.order.number,
            s.order.customer?.companyName ?? "",
            s.warehouse?.name ?? "",
            String(s.items.reduce((sum, i) => sum + i.quantity, 0)),
            STATUS_LABELS[s.status] ?? s.status,
            s.createdAt.toLocaleDateString("uz-UZ"),
          ])}
        />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const active = statusFilter === tab.value;
          return (
            <Link
              key={tab.value}
              href={tab.value ? `/admin/shipments?status=${tab.value}` : "/admin/shipments"}
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

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Raqam</th>
              <th className="px-4 py-3">Buyurtma</th>
              <th className="px-4 py-3">Mijoz</th>
              <th className="px-4 py-3">Ombor</th>
              <th className="px-4 py-3 text-right">Pozitsiyalar</th>
              <th className="px-4 py-3">Holat</th>
              <th className="px-4 py-3">Mas&apos;ul</th>
              <th className="px-4 py-3">Amallar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {shipments.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-slate-400">
                  Jo&apos;natmalar yo&apos;q. Buyurtma sahifasidan yarating.
                </td>
              </tr>
            )}
            {shipments.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-semibold text-slate-800">{s.number}</td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/orders/${s.orderId}`}
                    className="font-medium text-indigo-600 hover:underline"
                  >
                    {s.order.number}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {s.order.customer?.companyName ?? "—"}
                </td>
                <td className="px-4 py-3 text-slate-600">{s.warehouse?.name ?? "—"}</td>
                <td className="px-4 py-3 text-right text-slate-700">
                  {s.items.reduce((sum, i) => sum + i.quantity, 0)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      STATUS_STYLE[s.status] ?? "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {STATUS_LABELS[s.status] ?? s.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {s.responsible?.name ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <ShipmentStatusActions id={s.id} status={s.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
