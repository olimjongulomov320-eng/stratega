import Link from "next/link";
import { requirePagePermission } from "@/lib/require-permission";
import { formatSum } from "@/lib/format";
import {
  getLowStockProducts,
  getReorderRecommendations,
  getInventoryValue,
  getDeadStock,
  getTurnover,
  getInventoryForecast,
} from "@/lib/inventory-assistant";
import { CsvExportButton } from "@/components/csv-export-button";

export const dynamic = "force-dynamic";

export default async function InventoryAnalyticsPage() {
  await requirePagePermission("stock.read");

  const [
    lowStock,
    reorderRecs,
    inventoryValue,
    deadStock,
    turnover,
    forecast,
  ] = await Promise.all([
    getLowStockProducts(),
    getReorderRecommendations(),
    getInventoryValue(),
    getDeadStock(60, 30),
    getTurnover(90),
    getInventoryForecast(),
  ]);

  const outOfStock = forecast.filter((f) => f.currentStock <= 0);
  const overstocked = forecast.filter(
    (f) => f.currentStock > 0 && f.daysUntilStockout !== null && f.daysUntilStockout > 180
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventar tahlili</h1>
          <p className="mt-1 text-slate-500">
            Aylanma, o&apos;lik ombor, qayta buyurtma va qoldiq prognozi —
            haqiqiy harakatlar tarixidan.
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
            filename="inventar-tahlili"
            header={["Ko'rsatkich", "Qiymat"]}
            rows={[
              ["Ombor qiymati", String(inventoryValue.totalValue)],
              ["COGS (90 kun)", String(turnover.cogs)],
              ["Aylanma (yillik)", turnover.turnover.toFixed(2)],
              ["Ombor kunlari", turnover.daysOfStock ? String(Math.round(turnover.daysOfStock)) : "—"],
              ["Kam qolgan", String(lowStock.length)],
              ["O'lik ombor", String(deadStock.length)],
              ["Qayta buyurtma tavsiyasi", String(reorderRecs.length)],
            ]}
          />
        </div>
      </div>

      {/* KPI */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-2xl font-black text-slate-900">
            {inventoryValue.totalValueFormatted}
          </p>
          <p className="mt-1 text-sm text-slate-500">Ombor qiymati</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-2xl font-black text-slate-900">
            {turnover.turnover.toFixed(2)}×
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Yillik aylanma (90 kun asosida)
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-2xl font-black text-slate-900">
            {turnover.daysOfStock !== null
              ? `${Math.round(turnover.daysOfStock)} kun`
              : "—"}
          </p>
          <p className="mt-1 text-sm text-slate-500">Ombordagi o&apos;rtacha kun</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-2xl font-black text-rose-600">{deadStock.length}</p>
          <p className="mt-1 text-sm text-slate-500">
            O&apos;lik ombor (60+ kun sotilmagan)
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xl font-black text-amber-600">{lowStock.length}</p>
          <p className="mt-1 text-sm text-slate-500">Kam qolgan mahsulotlar</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xl font-black text-rose-700">{outOfStock.length}</p>
          <p className="mt-1 text-sm text-slate-500">Tugagan mahsulotlar</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xl font-black text-sky-600">{overstocked.length}</p>
          <p className="mt-1 text-sm text-slate-500">
            Ortiqcha ombor (180+ kunlik zaxira)
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Qayta buyurtma */}
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Qayta buyurtma tavsiyalari
          </h2>
          <p className="text-xs text-slate-400">
            O&apos;rtacha sotuv tezligi va zaxira zapas asosida deterministik
            hisoblangan.
          </p>
          <div className="mt-4 flex flex-col divide-y divide-slate-100">
            {reorderRecs.map((r) => (
              <div
                key={r.productId}
                className="flex items-center justify-between py-2.5 text-sm"
              >
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
            {reorderRecs.length === 0 && (
              <p className="py-4 text-center text-sm text-slate-400">
                Tavsiyalar yo&apos;q.
              </p>
            )}
          </div>
        </div>

        {/* O'lik ombor */}
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">
            O&apos;lik ombor
          </h2>
          <p className="text-xs text-slate-400">
            Qoldiq bor, lekin 60+ kun sotilmagan mahsulotlar (qiymat bo&apos;yicha).
          </p>
          <div className="mt-4 flex flex-col divide-y divide-slate-100">
            {deadStock.map((d) => (
              <div
                key={d.productId}
                className="flex items-center justify-between py-2.5 text-sm"
              >
                <div>
                  <p className="font-medium text-slate-800">{d.name}</p>
                  <p className="text-xs text-slate-400">
                    oxirgi sotuv:{" "}
                    {d.lastSoldAt
                      ? d.lastSoldAt.toLocaleDateString("uz-UZ")
                      : "hech qachon"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-800">{formatSum(d.value)}</p>
                  <p className="text-xs text-slate-400">{d.stock} dona</p>
                </div>
              </div>
            ))}
            {deadStock.length === 0 && (
              <p className="py-4 text-center text-sm text-slate-400">
                O&apos;lik ombor yo&apos;q — ajoyib.
              </p>
            )}
          </div>
        </div>

        {/* Kategoriya bo'yicha qiymat */}
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Kategoriya bo&apos;yicha ombor qiymati
          </h2>
          <div className="mt-4 flex flex-col divide-y divide-slate-100">
            {inventoryValue.byCategory.map((c) => (
              <div
                key={c.categoryName}
                className="flex items-center justify-between py-2.5 text-sm"
              >
                <p className="font-medium text-slate-800">{c.categoryName}</p>
                <p className="font-semibold text-slate-800">{formatSum(c.value)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Qoldiq prognozi */}
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Qoldiq tugash prognozi
          </h2>
          <p className="text-xs text-slate-400">
            Kunlik sotuv sur&apos;ati asosida — eng tez tugaydigan 10 ta.
          </p>
          <div className="mt-4 flex flex-col divide-y divide-slate-100">
            {forecast
              .filter((f) => f.daysUntilStockout !== null)
              .slice(0, 10)
              .map((f) => (
                <div
                  key={f.productId}
                  className="flex items-center justify-between py-2.5 text-sm"
                >
                  <p className="font-medium text-slate-800">{f.name}</p>
                  <div className="text-right">
                    <p
                      className={`font-semibold ${
                        (f.daysUntilStockout ?? 999) <= 7
                          ? "text-rose-600"
                          : (f.daysUntilStockout ?? 999) <= 30
                            ? "text-amber-600"
                            : "text-slate-700"
                      }`}
                    >
                      {Math.round(f.daysUntilStockout!)} kun
                    </p>
                    <p className="text-xs text-slate-400">
                      {f.currentStock} dona · {f.avgDailyConsumption.toFixed(1)}/kun
                    </p>
                  </div>
                </div>
              ))}
            {forecast.filter((f) => f.daysUntilStockout !== null).length === 0 && (
              <p className="py-4 text-center text-sm text-slate-400">
                Sotuv ma&apos;lumotlari yetarli emas.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
