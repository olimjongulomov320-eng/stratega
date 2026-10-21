import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatSum } from "@/lib/format";
import { getActiveAlerts } from "@/lib/alerts";
import {
  getRevenueReport,
  getSalesByPeriod,
  getReorderRecommendations,
} from "@/lib/inventory-assistant";

export const dynamic = "force-dynamic";

const ALERT_SEVERITY_ICON: Record<string, string> = {
  CRITICAL: "🔴",
  WARNING: "🟠",
  INFO: "🟡",
};

// Server komponentda sana hisobi — har so'rovda yangilanadi.
function thirtyDaysAgo() {
  return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
}

export default async function AdminDashboardPage() {
  const [
    productCount,
    customerCount,
    newRequestCount,
    pendingOrderCount,
    products,
    revenueReport,
    periods,
    reorderRecs,
    recentOrders,
    pendingShipments,
    alerts,
  ] = await Promise.all([
    prisma.product.count({ where: { isActive: true } }),
    prisma.customer.count({ where: { isActive: true } }),
    prisma.rfqRequest.count({ where: { status: "NEW" } }),
    prisma.order.count({
      where: { status: { in: ["DRAFT", "CONFIRMED", "PROCESSING"] } },
    }),
    prisma.product.findMany({ select: { stock: true, price: true, isActive: true } }),
    getRevenueReport({ from: thirtyDaysAgo() }),
    getSalesByPeriod(),
    getReorderRecommendations(),
    prisma.order.findMany({
      where: { status: { not: "CANCELLED" } },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        customer: { select: { companyName: true } },
        items: { select: { quantity: true, price: true } },
      },
    }),
    prisma.shipment.count({ where: { status: { in: ["DRAFT", "READY"] } } }),
    getActiveAlerts(6),
  ]);

  const inventoryValue = products.reduce((s, p) => s + p.stock * p.price, 0);
  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= 5).length;

  const kpis = [
    {
      label: "Tushum (30 kun)",
      value: formatSum(revenueReport.revenue),
      href: "/admin/analytics",
      accent: "text-slate-900",
    },
    {
      label: `Sof foyda · ${revenueReport.marginPercent.toFixed(1)}%`,
      value: formatSum(revenueReport.grossProfit),
      href: "/admin/analytics",
      accent: revenueReport.grossProfit >= 0 ? "text-emerald-600" : "text-rose-600",
    },
    { label: "Ombor qiymati", value: formatSum(inventoryValue), href: "/admin/stock", accent: "text-slate-900" },
    {
      label: "Kutilayotgan buyurtmalar",
      value: String(pendingOrderCount),
      href: "/admin/orders",
      accent: "text-slate-900",
    },
    { label: "Mahsulotlar", value: String(productCount), href: "/admin/products", accent: "text-slate-900" },
    { label: "Faol mijozlar", value: String(customerCount), href: "/admin/customers", accent: "text-slate-900" },
    { label: "Yangi arizalar", value: String(newRequestCount), href: "/admin/requests", accent: "text-slate-900" },
    {
      label: "Kam qolgan mahsulotlar",
      value: String(lowStockCount),
      href: "/admin/analytics/inventory",
      accent: lowStockCount > 0 ? "text-amber-600" : "text-slate-900",
    },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Boshqaruv paneli</h1>
          <p className="mt-1 text-slate-500">
            Kompaniyaning umumiy holati — bir qarashda.
          </p>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="text-right">
            <p className="font-bold text-slate-900">{formatSum(periods.today.revenue)}</p>
            <p className="text-xs text-slate-400">Bugun · {periods.today.orders} ta</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-slate-900">{formatSum(periods.week.revenue)}</p>
            <p className="text-xs text-slate-400">Hafta · {periods.week.orders} ta</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-slate-900">{formatSum(periods.month.revenue)}</p>
            <p className="text-xs text-slate-400">Oy · {periods.month.orders} ta</p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-xl border border-slate-200 bg-white p-5 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md"
          >
            <p className={`text-2xl font-black ${stat.accent}`}>{stat.value}</p>
            <p className="mt-1 text-sm text-slate-500">{stat.label}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Ogohlantirishlar */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Diqqat talab</h2>
            <Link href="/admin/alerts" className="text-sm font-medium text-indigo-600 hover:underline">
              Barchasi →
            </Link>
          </div>
          <div className="mt-3 flex flex-col divide-y divide-slate-100">
            {alerts.length === 0 && (
              <p className="py-4 text-center text-sm text-slate-400">
                Faol ogohlantirish yo&apos;q.
              </p>
            )}
            {alerts.map((alert) => (
              <div key={alert.id} className="flex items-start gap-2 py-2.5 text-sm">
                <span>{ALERT_SEVERITY_ICON[alert.severity] ?? "⚪"}</span>
                <div>
                  <p className="font-medium text-slate-800">{alert.title}</p>
                  {alert.description && (
                    <p className="text-xs text-slate-500">{alert.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Qayta buyurtma */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              Qayta buyurtma
            </h2>
            <Link
              href="/admin/analytics/inventory"
              className="text-sm font-medium text-indigo-600 hover:underline"
            >
              Tahlil →
            </Link>
          </div>
          <div className="mt-3 flex flex-col divide-y divide-slate-100">
            {reorderRecs.length === 0 && (
              <p className="py-4 text-center text-sm text-slate-400">
                Hozircha tavsiyalar yo&apos;q.
              </p>
            )}
            {reorderRecs.slice(0, 6).map((r) => (
              <div key={r.productId} className="flex items-center justify-between py-2.5 text-sm">
                <div>
                  <p className="font-medium text-slate-800">{r.name}</p>
                  <p className="text-xs text-slate-400">{r.reason}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-800">+{r.suggestedQuantity}</p>
                  <p className="text-xs text-slate-400">qoldiq: {r.currentStock}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* So'nggi buyurtmalar */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              So&apos;nggi buyurtmalar
            </h2>
            <Link href="/admin/orders" className="text-sm font-medium text-indigo-600 hover:underline">
              Barchasi →
            </Link>
          </div>
          <div className="mt-3 flex flex-col divide-y divide-slate-100">
            {recentOrders.map((order) => {
              const total = order.items.reduce(
                (s, i) => s + i.price * i.quantity,
                0
              );
              return (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="flex items-center justify-between py-2.5 text-sm hover:bg-slate-50"
                >
                  <div>
                    <p className="font-medium text-slate-800">{order.number}</p>
                    <p className="text-xs text-slate-400">
                      {order.customer?.companyName ?? "Mijozsiz"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-800">{formatSum(total)}</p>
                    <p className="text-xs text-slate-400">{order.status}</p>
                  </div>
                </Link>
              );
            })}
            {recentOrders.length === 0 && (
              <p className="py-4 text-center text-sm text-slate-400">
                Buyurtmalar yo&apos;q.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/admin/products/new"
          className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          + Yangi mahsulot qo&apos;shish
        </Link>
        <Link
          href="/admin/orders/new"
          className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-600"
        >
          + Yangi buyurtma
        </Link>
        <Link
          href="/admin/stock-documents/new"
          className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-600"
        >
          + Ombor hujjati
        </Link>
        <Link
          href="/admin/shipments"
          className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-600"
        >
          Jo&apos;natmalar ({pendingShipments} kutilmoqda)
        </Link>
        <Link
          href="/admin/payments"
          className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-600"
        >
          To&apos;lovlar
        </Link>
      </div>
    </div>
  );
}
