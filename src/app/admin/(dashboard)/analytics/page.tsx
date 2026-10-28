import Link from "next/link";
import { requirePagePermission } from "@/lib/require-permission";
import { formatSum } from "@/lib/format";
import {
  getRevenueReport,
  getTopCustomers,
  getTopProducts,
  getTopCategories,
  getProductProfitability,
  getSalesByPeriod,
  type SalesFilters,
} from "@/lib/inventory-assistant";
import { CsvExportButton } from "@/components/csv-export-button";

export const dynamic = "force-dynamic";

const RANGES = [
  { key: "7d", label: "7 kun", days: 7 },
  { key: "30d", label: "30 kun", days: 30 },
  { key: "90d", label: "90 kun", days: 90 },
  { key: "365d", label: "1 yil", days: 365 },
] as const;

type RangeKey = (typeof RANGES)[number]["key"];

function parseRange(key: string | undefined): { filters: SalesFilters; days: number } {
  const range = RANGES.find((r) => r.key === key) ?? RANGES[1];
  return {
    filters: { from: new Date(Date.now() - range.days * 24 * 60 * 60 * 1000) },
    days: range.days,
  };
}

export default async function AnalyticsPage(
  props: PageProps<"/admin/analytics">
) {
  await requirePagePermission("orders.read");

  const sp = await props.searchParams;
  const rangeKey = typeof sp.range === "string" ? sp.range : "30d";
  const { filters, days } = parseRange(rangeKey);

  const [report, topCustomers, topProducts, topCategories, profitability, periods] =
    await Promise.all([
      getRevenueReport(filters),
      getTopCustomers(10, filters),
      getTopProducts(10, filters),
      getTopCategories(10, filters),
      getProductProfitability(10, filters),
      getSalesByPeriod(),
    ]);

  const activeKey: RangeKey = (RANGES.find((r) => r.key === rangeKey)?.key ??
    "30d") as RangeKey;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Savdo tahlili</h1>
          <p className="mt-1 text-slate-500">
            Haqiqiy buyurtma ma&apos;lumotlaridan hisoblangan tushum, foyda va
            marja.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/analytics/inventory"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Inventar tahlili →
          </Link>
          <CsvExportButton
            filename="savdo-tahlili"
            header={["Ko'rsatkich", "Qiymat"]}
            rows={[
              ["Tushum (revenue)", String(report.revenue)],
              ["Tannarx (COGS)", String(report.cogs)],
              ["Sof foyda", String(report.grossProfit)],
              ["Marja %", report.marginPercent.toFixed(1)],
              ["Buyurtmalar", String(report.orderCount)],
              ["O'rtacha chek", String(Math.round(report.averageOrderValue))],
            ]}
          />
        </div>
      </div>

      {/* Davr tanlash */}
      <div className="mt-6 flex flex-wrap gap-2">
        {RANGES.map((range) => (
          <Link
            key={range.key}
            href={`/admin/analytics?range=${range.key}`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              activeKey === range.key
                ? "bg-slate-900 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {range.label}
          </Link>
        ))}
      </div>

      {/* Asosiy KPI */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-2xl font-black text-slate-900">
            {formatSum(report.revenue)}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Tushum ({days} kun)
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-2xl font-black text-slate-900">
            {formatSum(report.cogs)}
          </p>
          <p className="mt-1 text-sm text-slate-500">Tannarx (COGS)</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p
            className={`text-2xl font-black ${
              report.grossProfit >= 0 ? "text-emerald-600" : "text-rose-600"
            }`}
          >
            {formatSum(report.grossProfit)}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Sof foyda · {report.marginPercent.toFixed(1)}% marja
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-2xl font-black text-slate-900">
            {report.orderCount}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Buyurtmalar · o&apos;rtacha {formatSum(report.averageOrderValue)}
          </p>
        </div>
      </div>

      {/* Bugun / hafta / oy */}
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Bugun", data: periods.today },
          { label: "Shu hafta", data: periods.week },
          { label: "Shu oy", data: periods.month },
        ].map((p) => (
          <div
            key={p.label}
            className="rounded-xl border border-slate-200 bg-white p-5"
          >
            <p className="text-lg font-black text-slate-900">
              {formatSum(p.data.revenue)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {p.label} · {p.data.orders} ta buyurtma
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Top mijozlar */}
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Eng qimmatli mijozlar
          </h2>
          <p className="text-xs text-slate-400">Tushum bo&apos;yicha.</p>
          <div className="mt-4 flex flex-col divide-y divide-slate-100">
            {topCustomers.map((c, i) => (
              <div
                key={c.customerId ?? `none-${i}`}
                className="flex items-center justify-between py-2.5 text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 text-xs font-semibold text-slate-400">
                    {i + 1}
                  </span>
                  <p className="font-medium text-slate-800">{c.companyName}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-800">
                    {formatSum(c.revenue)}
                  </p>
                  <p className="text-xs text-slate-400">{c.orders} ta buyurtma</p>
                </div>
              </div>
            ))}
            {topCustomers.length === 0 && (
              <p className="py-4 text-center text-sm text-slate-400">
                Ma&apos;lumot yo&apos;q.
              </p>
            )}
          </div>
        </div>

        {/* Top kategoriyalar */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-slate-900">Top kategoriyalar</h2>
          <div className="mt-4 divide-y divide-slate-100">
            {topCategories.map((c, i) => (
              <div key={c.categoryId ?? `none-${i}`} className="flex items-center justify-between py-2.5 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900">{c.name}</p>
                  <p className="text-xs text-slate-500">{c.unitsSold} dona</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-900">{formatSum(c.revenue)}</p>
                  <p className="text-xs text-slate-500">foyda {formatSum(c.grossProfit)}</p>
                </div>
              </div>
            ))}
            {topCategories.length === 0 && (
              <p className="py-4 text-sm text-slate-500">Bu davrda sotuv yo&apos;q.</p>
            )}
          </div>
        </div>

        {/* Top mahsulotlar */}
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Eng ko&apos;p sotilgan mahsulotlar
          </h2>
          <p className="text-xs text-slate-400">Barcha vaqt bo&apos;yicha.</p>
          <div className="mt-4 flex flex-col divide-y divide-slate-100">
            {topProducts.map((p, i) => (
              <div
                key={p.productId}
                className="flex items-center justify-between py-2.5 text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 text-xs font-semibold text-slate-400">
                    {i + 1}
                  </span>
                  <p className="font-medium text-slate-800">{p.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-800">
                    {formatSum(p.revenue)}
                  </p>
                  <p className="text-xs text-slate-400">{p.unitsSold} dona</p>
                </div>
              </div>
            ))}
            {topProducts.length === 0 && (
              <p className="py-4 text-center text-sm text-slate-400">
                Savdo yo&apos;q.
              </p>
            )}
          </div>
        </div>

        {/* Marja */}
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Eng foydali mahsulotlar
          </h2>
          <p className="text-xs text-slate-400">Marja foizi bo&apos;yicha.</p>
          <div className="mt-4 flex flex-col divide-y divide-slate-100">
            {profitability.map((p) => (
              <div
                key={p.productId}
                className="flex items-center justify-between py-2.5 text-sm"
              >
                <p className="font-medium text-slate-800">{p.name}</p>
                <div className="text-right">
                  <p
                    className={`font-semibold ${
                      p.marginPercent >= 0 ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {p.marginPercent.toFixed(1)}%
                  </p>
                  <p className="text-xs text-slate-400">
                    {formatSum(p.grossProfit)}
                  </p>
                </div>
              </div>
            ))}
            {profitability.length === 0 && (
              <p className="py-4 text-center text-sm text-slate-400">
                Ma&apos;lumot yo&apos;q.
              </p>
            )}
          </div>
        </div>

        {/* Tezkor havolalar */}
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Boshqa hisobotlar
          </h2>
          <div className="mt-4 flex flex-col gap-2">
            <Link
              href="/admin/analytics/inventory"
              className="rounded-lg border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Inventar tahlili — aylanma, o&apos;lik ombor, qayta buyurtma →
            </Link>
            <Link
              href="/admin/analytics/suppliers"
              className="rounded-lg border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Yetkazib beruvchilar tahlili — xaridlar, tannarx, muddat →
            </Link>
            <Link
              href="/admin/payments"
              className="rounded-lg border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              To&apos;lovlar va qarzdorlik →
            </Link>
            <Link
              href="/admin/stock-movements"
              className="rounded-lg border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Ombor harakatlari jurnali →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
