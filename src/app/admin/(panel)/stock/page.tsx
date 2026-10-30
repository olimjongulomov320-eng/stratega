import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePage } from "@/lib/admin";
import { can } from "@/lib/permissions";
import { PageHeader, Table, Td, Stat, Money, Filters, inputCls, btn, Badge, LinkButton, Card } from "@/components/admin/ui";
import { getLowStockThreshold } from "@/lib/settings";
import { formatNumber, daysAgo } from "@/lib/format";
import { StockCategoryChart, type CategoryValue } from "./stock-category-chart";
import { StockMovementChart, type DailyMovement } from "./stock-movement-chart";

export default async function StockPage(props: PageProps<"/admin/stock">) {
  const session = await requirePage("stock.read");
  const sp = await props.searchParams;
  const wh = typeof sp.warehouse === "string" ? sp.warehouse : "";
  const filter = typeof sp.filter === "string" ? sp.filter : "";
  const q = typeof sp.q === "string" ? sp.q.trim().toLowerCase() : "";
  const since = daysAgo(29);
  since.setHours(0, 0, 0, 0);
  const [warehouses, products, threshold, moves] = await Promise.all([
    prisma.warehouse.findMany({ orderBy: [{ isDefault: "desc" }, { name: "asc" }] }),
    prisma.product.findMany({ include: { category: true, stockLevels: true }, orderBy: [{ category: { sortOrder: "asc" } }, { name: "asc" }] }),
    getLowStockThreshold(),
    // Transfers between our own warehouses are not real inflow/outflow — excluded.
    prisma.stockMove.findMany({
      where: { createdAt: { gte: since }, reason: { notIn: ["TRANSFER_IN", "TRANSFER_OUT"] }, ...(wh ? { warehouseId: wh } : {}) },
      select: { delta: true, createdAt: true },
    }),
  ]);
  const canCost = can(session.role, "finance.read");

  const rows = products
    .map((p) => {
      const levels = wh ? p.stockLevels.filter((l) => l.warehouseId === wh) : p.stockLevels;
      const qty = levels.reduce((s, l) => s + l.quantity, 0);
      const reserved = levels.reduce((s, l) => s + l.reserved, 0);
      const limit = Math.max(p.minimumStock, p.reorderPoint ?? 0, threshold);
      const state = qty <= 0 ? "out" : qty <= limit ? "low" : "ok";
      return { p, qty, reserved, state };
    })
    .filter((r) => (filter === "low" ? r.state !== "ok" : filter === "out" ? r.state === "out" : true))
    .filter((r) => !q || `${r.p.name} ${r.p.sku ?? ""}`.toLowerCase().includes(q));

  const valueCost = rows.reduce((s, r) => s + r.qty * (r.p.costPrice ?? 0), 0);
  const valueRetail = rows.reduce((s, r) => s + r.qty * r.p.price, 0);
  const units = rows.reduce((s, r) => s + r.qty, 0);

  // Charts: last 30 days of inflow/outflow, and stock value by category.
  const dayKey = (d: Date) => `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}`;
  const buckets = new Map<string, { inflow: number; outflow: number }>();
  for (let i = 0; i < 30; i++) buckets.set(dayKey(new Date(since.getTime() + i * 86400000)), { inflow: 0, outflow: 0 });
  for (const m of moves) {
    const b = buckets.get(dayKey(m.createdAt));
    if (!b) continue;
    if (m.delta > 0) b.inflow += m.delta;
    else b.outflow += -m.delta;
  }
  const movementData: DailyMovement[] = [...buckets.entries()].map(([date, v]) => ({ date, ...v }));
  const byCategory = new Map<string, number>();
  for (const r of rows) {
    const unit = canCost ? r.p.costPrice ?? 0 : r.p.price;
    if (r.qty > 0 && unit > 0) byCategory.set(r.p.category.name, (byCategory.get(r.p.category.name) ?? 0) + r.qty * unit);
  }
  const sortedCats = [...byCategory.entries()].sort((a, b) => b[1] - a[1]);
  const categoryData: CategoryValue[] = [
    ...sortedCats.slice(0, 6).map(([name, value]) => ({ name, value })),
    ...(sortedCats.length > 6 ? [{ name: "Boshqalar", value: sortedCats.slice(6).reduce((a, [, v]) => a + v, 0) }] : []),
  ];

  return (
    <div>
      <PageHeader
        title="Sklad"
        description="Barcha mahsulotlarning ombordagi holati."
        actions={
          <>
            <a href={`/api/admin/export?type=stock${wh ? `&warehouse=${wh}` : ""}`} className={btn("secondary")}>CSV hisobot</a>
            {can(session.role, "stock.write") && <LinkButton href="/admin/stock-documents/new">+ Ombor hujjati</LinkButton>}
          </>
        }
      />
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Mahsulotlar" value={rows.length} />
        <Stat label="Birliklar" value={formatNumber(units)} />
        {canCost && <Stat label="Qiymati (tannarx)" value={<Money value={valueCost} />} />}
        <Stat label="Qiymati (sotuv narxi)" value={<Money value={valueRetail} />} />
      </div>
      <div className="mb-4 grid gap-4 lg:grid-cols-2">
        <Card title={canCost ? "Ombor qiymati kategoriyalar bo'yicha (tannarx)" : "Ombor qiymati kategoriyalar bo'yicha (sotuv narxi)"}>
          <StockCategoryChart data={categoryData} />
        </Card>
        <Card title="So'nggi 30 kun: kirim va chiqim (dona)">
          <StockMovementChart data={movementData} />
        </Card>
      </div>
      <Filters>
        <input name="q" defaultValue={q} placeholder="Qidirish" className={`${inputCls} max-w-xs`} />
        <select name="warehouse" defaultValue={wh} className={`${inputCls} max-w-xs`}>
          <option value="">Barcha omborlar</option>
          {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
        <select name="filter" defaultValue={filter} className={`${inputCls} max-w-xs`}>
          <option value="">Barchasi</option>
          <option value="low">Kam qolgan va tugagan</option>
          <option value="out">Faqat tugagan</option>
        </select>
        <button className={btn("secondary")}>Ko&apos;rsatish</button>
      </Filters>
      <Table head={["Mahsulot", "Kategoriya", "Qoldiq", "Band", "Tayyor", ...(canCost ? ["Qiymati (tannarx)"] : []), "Holat"]}>
        {rows.map(({ p, qty, reserved, state }) => (
          <tr key={p.id} className="hover:bg-slate-50">
            <Td>
              <Link href={`/admin/products/${p.id}/overview`} className="font-medium text-slate-800 hover:text-indigo-600">{p.name}</Link>
              <div className="text-xs text-slate-400">{p.sku ?? ""}</div>
            </Td>
            <Td>{p.category.name}</Td>
            <Td right>{qty}</Td>
            <Td right>{reserved}</Td>
            <Td right>{qty - reserved}</Td>
            {canCost && <Td right><Money value={p.costPrice ? qty * p.costPrice : null} /></Td>}
            <Td>{state === "out" ? <Badge tone="red">Tugagan</Badge> : state === "low" ? <Badge tone="amber">Kam qolgan</Badge> : <Badge tone="green">Yetarli</Badge>}</Td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
