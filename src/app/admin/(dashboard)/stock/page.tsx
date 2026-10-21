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
import { requirePagePermission } from "@/lib/require-permission";
import {
  effectiveLowStockThreshold,
  getLowStockThreshold,
} from "@/lib/inventory-assistant";

export const dynamic = "force-dynamic";

const LOOKBACK_DAYS = 30;
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

export default async function StockPage(props: PageProps<"/admin/stock">) {
  await requirePagePermission("stock.read");
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const sp = await props.searchParams;
  const warehouseParam = typeof sp.warehouse === "string" ? sp.warehouse : "";

  const thirtyDaysAgo = daysAgo(LOOKBACK_DAYS);
  const globalThreshold = await getLowStockThreshold();

  const [products, recentMoves, warehouses] = await Promise.all([
    prisma.product.findMany({
      include: { category: true },
      orderBy: { stock: "asc" },
    }),
    prisma.stockMove.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { productId: true, change: true, reason: true, createdAt: true },
    }),
    prisma.warehouse.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, code: true },
    }),
  ]);

  // Tanlangan ombor (bo'sh = barcha omborlar yig'indisi).
  const selectedWarehouse = warehouses.find((w) => w.id === warehouseParam) ?? null;

  // Tanlangan ombor bo'lsa — o'sha ombor qoldig'i, aks holda umumiy.
  const warehouseStocks = selectedWarehouse
    ? await prisma.stock.findMany({
        where: { warehouseId: selectedWarehouse.id },
        select: { productId: true, quantity: true, reserved: true },
      })
    : [];
  const stockByProduct = new Map(
    warehouseStocks.map((s) => [
      s.productId,
      { quantity: s.quantity, reserved: s.reserved },
    ])
  );

  function quantityOf(productId: string, total: number): number {
    if (!selectedWarehouse) return total;
    return stockByProduct.get(productId)?.quantity ?? 0;
  }

  function reservedOf(productId: string): number {
    if (!selectedWarehouse) return 0;
    return stockByProduct.get(productId)?.reserved ?? 0;
  }

  // --- KPI-lar ---
  const rows = products.map((p) => ({
    product: p,
    quantity: quantityOf(p.id, p.stock),
    reserved: reservedOf(p.id),
  }));

  const totalProducts = rows.filter((r) => r.quantity > 0 || !selectedWarehouse).length;
  const totalValue = rows.reduce(
    (sum, r) => sum + r.quantity * (r.product.costPrice ?? r.product.price),
    0
  );
  const lowStockCount = rows.filter((r) => {
    const threshold = effectiveLowStockThreshold(
      r.product.minimumStock,
      globalThreshold
    );
    return r.quantity > 0 && r.quantity <= threshold;
  }).length;
  const outOfStockCount = rows.filter((r) => r.quantity <= 0).length;
  const reservedUnits = rows.reduce((sum, r) => sum + r.reserved, 0);

  const kpis = [
    { label: "Jami mahsulotlar", value: String(totalProducts) },
    { label: "Ombor qiymati", value: formatSum(totalValue) },
    { label: "Kam qolganlar", value: String(lowStockCount) },
    { label: "Tugaganlar", value: String(outOfStockCount) },
  ];

  // --- So'nggi 30 kunlik iste'mol (ORDER va ISSUE sababli chiqimlar) ---
  const consumptionByProduct = new Map<string, number>();
  const touchedProductIds = new Set<string>();

  for (const move of recentMoves) {
    touchedProductIds.add(move.productId);
    if ((move.reason === "ORDER" || move.reason === "ISSUE") && move.change < 0) {
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

  for (const r of rows) {
    if (r.quantity <= 0) {
      attentionItems.push({
        productId: r.product.id,
        name: r.product.name,
        severity: "critical",
        reason: "Tugagan",
      });
      continue;
    }

    const days = daysUntilStockout(r.quantity, avgDailyConsumption(r.product.id));
    if (days !== null && days <= STOCKOUT_WARNING_DAYS) {
      attentionItems.push({
        productId: r.product.id,
        name: r.product.name,
        severity: days <= STOCKOUT_CRITICAL_DAYS ? "critical" : "warning",
        reason: `${Math.ceil(days)} kundan keyin tugaydi`,
      });
    } else if (!touchedProductIds.has(r.product.id) && r.product.isActive) {
      attentionItems.push({
        productId: r.product.id,
        name: r.product.name,
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
  for (const r of rows) {
    categoryValueMap.set(
      r.product.category.name,
      (categoryValueMap.get(r.product.category.name) ?? 0) +
        r.quantity * (r.product.costPrice ?? r.product.price)
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
            rows={rows.map((r) => ({
              name: r.product.name,
              category: r.product.category.name,
              price: r.product.price,
              stock: r.quantity,
              value: r.quantity * (r.product.costPrice ?? r.product.price),
              isActive: r.product.isActive,
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

      {/* Ombor tanlash */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-slate-500">Ombor:</span>
        <Link
          href="/admin/stock"
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
            !selectedWarehouse
              ? "bg-slate-900 text-white"
              : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          Barchasi
        </Link>
        {warehouses.map((w) => (
          <Link
            key={w.id}
            href={`/admin/stock?warehouse=${w.id}`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              selectedWarehouse?.id === w.id
                ? "bg-slate-900 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {w.name}
          </Link>
        ))}
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

      {selectedWarehouse && reservedUnits > 0 && (
        <p className="mt-3 text-sm text-slate-500">
          Band qilingan (zaxira): {reservedUnits} dona.
        </p>
      )}

      <AttentionPanel items={attentionItems} />

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="animate-fade-in-up rounded-xl border border-slate-200 bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <h2 className="text-lg font-semibold text-slate-900">
            Kategoriya bo&apos;yicha qiymat
          </h2>
          <div className="mt-4">
            <StockCategoryChart data={categoryChartData} />
          </div>
        </div>
        <div
          style={{ animationDelay: "60ms" }}
          className="animate-fade-in-up rounded-xl border border-slate-200 bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
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
        editable={Boolean(selectedWarehouse)}
        warehouseId={selectedWarehouse?.id ?? null}
        products={rows.map((r) => ({
          id: r.product.id,
          name: r.product.name,
          imageUrl: r.product.imageUrl,
          price: r.product.price,
          stock: r.quantity,
          reserved: r.reserved,
          isActive: r.product.isActive,
          isLow:
            r.quantity > 0 &&
            r.quantity <=
              effectiveLowStockThreshold(r.product.minimumStock, globalThreshold),
          category: { name: r.product.category.name },
          daysUntilStockout: daysUntilStockout(
            r.quantity,
            avgDailyConsumption(r.product.id)
          ),
        }))}
      />
    </div>
  );
}
