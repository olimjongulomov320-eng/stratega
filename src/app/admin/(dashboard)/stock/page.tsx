import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { formatSum } from "@/lib/format";
import { StockTable } from "./stock-table";
import { AttentionPanel, type AttentionItem } from "./attention-panel";
import { StockCategoryChart, type CategoryValue } from "./stock-category-chart";
import { StockMovementChart, type DailyMovement } from "./stock-movement-chart";
import { ExportReportButton } from "./export-report-button";

export const dynamic = "force-dynamic";

const LOOKBACK_DAYS = 30;
const LOW_STOCK_THRESHOLD = 5;
const STOCKOUT_WARNING_DAYS = 7;
const STOCKOUT_CRITICAL_DAYS = 3;

function daysUntilStockout(
  currentStock: number,
  avgDailyConsumption: number
): number | null {
  if (avgDailyConsumption <= 0) return null;
  if (currentStock <= 0) return 0;
  return currentStock / avgDailyConsumption;
}

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

export default async function StockPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const thirtyDaysAgo = daysAgo(LOOKBACK_DAYS);

  const [products, recentMoves] = await Promise.all([
    prisma.product.findMany({
      include: { category: true },
      orderBy: { stock: "asc" },
    }),
    prisma.stockMove.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { productId: true, change: true, reason: true, createdAt: true },
    }),
  ]);

  // --- KPI-lar ---
  const totalProducts = products.length;
  const totalValue = products.reduce((sum, p) => sum + p.stock * p.price, 0);
  const lowStockCount = products.filter(
    (p) => p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD
  ).length;
  const outOfStockCount = products.filter((p) => p.stock <= 0).length;

  const kpis = [
    { label: "Jami mahsulotlar", value: String(totalProducts) },
    { label: "Ombor qiymati", value: formatSum(totalValue) },
    { label: "Kam qolganlar", value: String(lowStockCount) },
    { label: "Tugaganlar", value: String(outOfStockCount) },
  ];

  // --- So'nggi 30 kunlik iste'mol (faqat ORDER chiqim) ---
  const consumptionByProduct = new Map<string, number>();
  const touchedProductIds = new Set<string>();

  for (const move of recentMoves) {
    touchedProductIds.add(move.productId);
    if (move.reason === "ORDER" && move.change < 0) {
      consumptionByProduct.set(
        move.productId,
        (consumptionByProduct.get(move.productId) ?? 0) + Math.abs(move.change)
      );
    }
  }

  function avgDailyConsumption(productId: string): number {
    const total = consumptionByProduct.get(productId) ?? 0;
    return total / LOOKBACK_DAYS;
  }

  // --- Diqqat talab qiladigan mahsulotlar ---
  const attentionItems: AttentionItem[] = [];

  for (const p of products) {
    if (p.stock <= 0) {
      attentionItems.push({
        productId: p.id,
        name: p.name,
        severity: "critical",
        reason: "Tugagan",
      });
      continue;
    }

    const days = daysUntilStockout(p.stock, avgDailyConsumption(p.id));
    if (days !== null && days <= STOCKOUT_WARNING_DAYS) {
      attentionItems.push({
        productId: p.id,
        name: p.name,
        severity: days <= STOCKOUT_CRITICAL_DAYS ? "critical" : "warning",
        reason: `${Math.ceil(days)} kundan keyin tugaydi`,
      });
    } else if (!touchedProductIds.has(p.id) && p.isActive) {
      attentionItems.push({
        productId: p.id,
        name: p.name,
        severity: "info",
        reason: `${LOOKBACK_DAYS} kundan beri harakat yo'q`,
      });
    }
  }

  const severityRank = { critical: 0, warning: 1, info: 2 };
  attentionItems.sort(
    (a, b) => severityRank[a.severity] - severityRank[b.severity]
  );

  // --- Kategoriya bo'yicha ombor qiymati ---
  const categoryValueMap = new Map<string, number>();
  for (const p of products) {
    categoryValueMap.set(
      p.category.name,
      (categoryValueMap.get(p.category.name) ?? 0) + p.stock * p.price
    );
  }
  const categoryChartData: CategoryValue[] = Array.from(
    categoryValueMap.entries()
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // --- Kunlik kirim/chiqim (30 kun, bo'sh kunlar ham 0 bilan) ---
  const dayBuckets = new Map<string, { inflow: number; outflow: number }>();
  for (let i = LOOKBACK_DAYS - 1; i >= 0; i--) {
    const key = daysAgo(i).toISOString().slice(5, 10); // MM-DD
    dayBuckets.set(key, { inflow: 0, outflow: 0 });
  }
  for (const move of recentMoves) {
    const key = move.createdAt.toISOString().slice(5, 10);
    const bucket = dayBuckets.get(key);
    if (!bucket) continue;
    if (move.change > 0) bucket.inflow += move.change;
    else bucket.outflow += Math.abs(move.change);
  }
  const movementChartData: DailyMovement[] = Array.from(
    dayBuckets.entries()
  ).map(([date, v]) => ({ date, ...v }));

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sklad</h1>
          <p className="mt-1 text-slate-500">
            Barcha mahsulotlarning ombordagi holati bir joyda.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportReportButton
            rows={products.map((p) => ({
              name: p.name,
              category: p.category.name,
              price: p.price,
              stock: p.stock,
              value: p.stock * p.price,
              isActive: p.isActive,
            }))}
          />
          <Link
            href="/admin/products/import"
            className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition-all duration-150 hover:scale-105 hover:bg-slate-50"
          >
            CSV import
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, i) => (
          <div
            key={kpi.label}
            style={{ animationDelay: `${i * 40}ms` }}
            className="animate-fade-in-up rounded-xl border border-slate-200 bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <p className="text-3xl font-black text-slate-900">{kpi.value}</p>
            <p className="mt-1 text-sm text-slate-500">{kpi.label}</p>
          </div>
        ))}
      </div>

      <AttentionPanel items={attentionItems} />

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="animate-fade-in-up rounded-xl border border-slate-200 bg-white p-5 transition-all duration-200 hover:shadow-md">
          <h2 className="text-lg font-semibold text-slate-900">
            Kategoriya bo&apos;yicha qiymat
          </h2>
          <div className="mt-4">
            <StockCategoryChart data={categoryChartData} />
          </div>
        </div>
        <div
          style={{ animationDelay: "60ms" }}
          className="animate-fade-in-up rounded-xl border border-slate-200 bg-white p-5 transition-all duration-200 hover:shadow-md"
        >
          <h2 className="text-lg font-semibold text-slate-900">
            Kirim / chiqim (30 kun)
          </h2>
          <div className="mt-4">
            <StockMovementChart data={movementChartData} />
          </div>
        </div>
      </div>

      <StockTable
        products={products.map((p) => ({
          id: p.id,
          name: p.name,
          imageUrl: p.imageUrl,
          price: p.price,
          stock: p.stock,
          isActive: p.isActive,
          category: { name: p.category.name },
          daysUntilStockout: daysUntilStockout(
            p.stock,
            avgDailyConsumption(p.id)
          ),
        }))}
      />
    </div>
  );
}
