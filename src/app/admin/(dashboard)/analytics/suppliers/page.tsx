import Link from "next/link";
import { requirePagePermission } from "@/lib/require-permission";
import { formatSum } from "@/lib/format";
import { getSupplierReport } from "@/lib/inventory-assistant";
import { CsvExportButton } from "@/components/csv-export-button";

export const dynamic = "force-dynamic";

const RANGES = [
  { key: "30d", label: "30 kun", days: 30 },
  { key: "90d", label: "90 kun", days: 90 },
  { key: "365d", label: "1 yil", days: 365 },
  { key: "all", label: "Hammasi", days: 0 },
] as const;

function rangeStart(days: number): Date | null {
  return days ? new Date(Date.now() - days * 24 * 60 * 60 * 1000) : null;
}

export default async function SupplierAnalyticsPage(
  props: PageProps<"/admin/analytics/suppliers">
) {
  await requirePagePermission("suppliers.read");

  const sp = await props.searchParams;
  const range =
    RANGES.find((r) => r.key === (typeof sp.range === "string" ? sp.range : "")) ??
    RANGES[1];
  const rows = await getSupplierReport({ from: rangeStart(range.days) });

  const totalPurchases = rows.reduce((sum, r) => sum + r.purchaseValue, 0);
  const totalDocs = rows.reduce((sum, r) => sum + r.postedDocuments, 0);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Yetkazib beruvchilar tahlili
          </h1>
          <p className="mt-1 text-slate-500">
            Qayd etilgan kirim hujjatlaridan hisoblangan xaridlar va ko&apos;rsatkichlar.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/analytics"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            ← Savdo tahlili
          </Link>
          <CsvExportButton
            filename="yetkazib-beruvchilar-tahlili"
            header={[
              "Yetkazib beruvchi",
              "Qayd etilgan hujjatlar",
              "Bekor qilingan",
              "Dona",
              "Xarid summasi",
              "O'rtacha tannarx",
              "Yetkazish muddati (kun)",
              "Bajarilish %",
            ]}
            rows={rows.map((r) => [
              r.name,
              String(r.postedDocuments),
              String(r.cancelledDocuments),
              String(r.unitsPurchased),
              String(r.purchaseValue),
              String(Math.round(r.averageUnitCost)),
              r.averageLeadTimeDays === null ? "" : r.averageLeadTimeDays.toFixed(1),
              r.completionRate.toFixed(0),
            ])}
          />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {RANGES.map((r) => (
          <Link
            key={r.key}
            href={`/admin/analytics/suppliers?range=${r.key}`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              range.key === r.key
                ? "bg-slate-900 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {r.label}
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-2xl font-black text-slate-900">{formatSum(totalPurchases)}</p>
          <p className="mt-1 text-sm text-slate-500">Jami xaridlar</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-2xl font-black text-slate-900">{totalDocs}</p>
          <p className="mt-1 text-sm text-slate-500">Qayd etilgan kirim hujjatlari</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-2xl font-black text-slate-900">{rows.length}</p>
          <p className="mt-1 text-sm text-slate-500">Yetkazib beruvchilar</p>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Yetkazib beruvchi</th>
              <th className="px-4 py-3 text-right">Hujjatlar</th>
              <th className="px-4 py-3 text-right">Dona</th>
              <th className="px-4 py-3 text-right">Xarid summasi</th>
              <th className="px-4 py-3 text-right">O&apos;rtacha tannarx</th>
              <th className="px-4 py-3 text-right">Yetkazish muddati</th>
              <th className="px-4 py-3 text-right">Bajarilish</th>
              <th className="px-4 py-3 text-right">Oxirgi xarid</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.supplierId}>
                <td className="px-4 py-3 font-medium text-slate-900">{r.name}</td>
                <td className="px-4 py-3 text-right">
                  {r.postedDocuments}
                  {r.cancelledDocuments > 0 && (
                    <span className="ml-1 text-xs text-rose-600">
                      (−{r.cancelledDocuments})
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">{r.unitsPurchased}</td>
                <td className="px-4 py-3 text-right font-semibold">
                  {formatSum(r.purchaseValue)}
                </td>
                <td className="px-4 py-3 text-right">
                  {r.unitsPurchased > 0 ? formatSum(r.averageUnitCost) : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  {r.averageLeadTimeDays === null
                    ? "—"
                    : `${r.averageLeadTimeDays.toFixed(1)} kun`}
                </td>
                <td className="px-4 py-3 text-right">
                  {r.postedDocuments + r.cancelledDocuments > 0
                    ? `${r.completionRate.toFixed(0)}%`
                    : "—"}
                </td>
                <td className="px-4 py-3 text-right text-slate-500">
                  {r.lastPurchaseAt ? r.lastPurchaseAt.toLocaleDateString("ru-RU") : "—"}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                  Ma&apos;lumot yo&apos;q.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-slate-400">
        Yetkazish muddati — yetkazib beruvchi mahsulotlarida belgilangan o&apos;rtacha
        qiymat. Bajarilish — qayd etilgan / (qayd etilgan + bekor qilingan) hujjatlar.
      </p>
    </div>
  );
}
