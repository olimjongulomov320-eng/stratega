import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { formatSum } from "@/lib/format";
import {
  getLowStockProducts,
  getReorderRecommendations,
  getTopProducts,
  getProductProfitability,
  getInventoryValue,
  getPendingOrders,
} from "@/lib/inventory-assistant";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const [
    lowStock,
    reorderRecs,
    topProducts,
    profitability,
    inventoryValue,
    pendingOrders,
  ] = await Promise.all([
    getLowStockProducts(),
    getReorderRecommendations(),
    getTopProducts(8),
    getProductProfitability(8),
    getInventoryValue(),
    getPendingOrders(),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Tahlil</h1>
      <p className="mt-1 text-slate-500">
        Savdo, ombor va foyda bo&apos;yicha aniq hisob-kitoblar.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-2xl font-black text-slate-900">
            {inventoryValue.totalValueFormatted}
          </p>
          <p className="mt-1 text-sm text-slate-500">Ombor qiymati</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-2xl font-black text-slate-900">
            {lowStock.length}
          </p>
          <p className="mt-1 text-sm text-slate-500">Kam qolgan mahsulotlar</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-2xl font-black text-slate-900">
            {reorderRecs.length}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Qayta buyurtma tavsiyasi
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-2xl font-black text-slate-900">
            {pendingOrders.length}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Kutilayotgan buyurtmalar
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Qayta buyurtma tavsiyalari
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            O&apos;rtacha sotuv tezligi, yetkazib berish muddati va zaxira
            zapas asosida hisoblangan.
          </p>
          <div className="mt-4 flex flex-col divide-y divide-slate-100">
            {reorderRecs.slice(0, 8).map((r) => (
              <div key={r.productId} className="flex items-center justify-between py-2.5 text-sm">
                <div>
                  <p className="font-medium text-slate-800">{r.name}</p>
                  <p className="text-xs text-slate-400">{r.reason}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-800">
                    +{r.suggestedQuantity}
                  </p>
                  <p className="text-xs text-slate-400">qoldiq: {r.currentStock}</p>
                </div>
              </div>
            ))}
            {reorderRecs.length === 0 && (
              <p className="py-4 text-center text-sm text-slate-400">
                Hozircha tavsiyalar yo&apos;q.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Eng ko&apos;p sotilgan mahsulotlar
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Barcha yakunlanmagan buyurtmalar bo&apos;yicha.
          </p>
          <div className="mt-4 flex flex-col divide-y divide-slate-100">
            {topProducts.map((p, i) => (
              <div key={p.productId} className="flex items-center justify-between py-2.5 text-sm">
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
                Hozircha savdo yo&apos;q.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Eng foydali mahsulotlar
          </h2>
          <p className="mt-1 text-xs text-slate-400">Marja foizi bo&apos;yicha.</p>
          <div className="mt-4 flex flex-col divide-y divide-slate-100">
            {profitability.map((p) => (
              <div key={p.productId} className="flex items-center justify-between py-2.5 text-sm">
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
                Hozircha ma&apos;lumot yo&apos;q.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Kategoriya bo&apos;yicha ombor qiymati
          </h2>
          <div className="mt-4 flex flex-col divide-y divide-slate-100">
            {inventoryValue.byCategory.map((c) => (
              <div key={c.categoryName} className="flex items-center justify-between py-2.5 text-sm">
                <p className="font-medium text-slate-800">{c.categoryName}</p>
                <p className="font-semibold text-slate-800">
                  {formatSum(c.value)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <Link
          href="/admin/stock"
          className="text-sm font-medium text-indigo-600 hover:underline"
        >
          To&apos;liq ombor tahlilini ko&apos;rish →
        </Link>
      </div>
    </div>
  );
}
