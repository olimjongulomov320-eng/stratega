import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePage } from "@/lib/admin";
import { can } from "@/lib/permissions";
import { PageHeader, Stat, Card, Badge, Money, LinkButton } from "@/components/admin/ui";
import { formatNumber, formatDate } from "@/lib/format";
import { RFQ_STATUS, ORDER_STATUS } from "@/lib/labels";
import { getLowStockThreshold } from "@/lib/settings";

export default async function Dashboard(props: PageProps<"/admin">) {
  const session = await requirePage();
  const sp = await props.searchParams;
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfDay.getTime() - ((startOfDay.getDay() + 6) % 7) * 86400000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lowThreshold = await getLowStockThreshold();

  const salesWhere = { status: { in: ["CONFIRMED", "SHIPPED", "COMPLETED"] as ("CONFIRMED" | "SHIPPED" | "COMPLETED")[] } };
  const [day, week, month, levels, products, newRfqs, pendingOrders, pendingShipments, unpaid, recentOrders, recentRfqs] = await Promise.all([
    prisma.order.aggregate({ where: { ...salesWhere, confirmedAt: { gte: startOfDay } }, _sum: { total: true }, _count: true }),
    prisma.order.aggregate({ where: { ...salesWhere, confirmedAt: { gte: startOfWeek } }, _sum: { total: true }, _count: true }),
    prisma.order.aggregate({ where: { ...salesWhere, confirmedAt: { gte: startOfMonth } }, _sum: { total: true }, _count: true }),
    prisma.stockLevel.aggregate({ _sum: { quantity: true, reserved: true } }),
    prisma.product.findMany({ where: { isActive: true }, select: { id: true, name: true, stock: true, price: true, costPrice: true, minimumStock: true, reorderPoint: true } }),
    prisma.rfqRequest.count({ where: { status: "NEW" } }),
    prisma.order.count({ where: { status: "DRAFT" } }),
    prisma.shipment.count({ where: { status: { in: ["DRAFT", "READY"] } } }),
    prisma.order.aggregate({ where: { ...salesWhere, paymentStatus: { in: ["UNPAID", "PARTIAL"] } }, _sum: { total: true, paidAmount: true }, _count: true }),
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 5, include: { customer: true } }),
    prisma.rfqRequest.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  const stockValueCost = products.reduce((s, p) => s + p.stock * (p.costPrice ?? 0), 0);
  const stockValueRetail = products.reduce((s, p) => s + p.stock * p.price, 0);
  const withoutCost = products.filter((p) => p.stock > 0 && !p.costPrice).length;
  const outOfStock = products.filter((p) => p.stock <= 0).length;
  const low = products.filter((p) => p.stock > 0 && p.stock <= Math.max(p.minimumStock, p.reorderPoint ?? 0, lowThreshold));
  const receivable = (unpaid._sum.total ?? 0) - (unpaid._sum.paidAmount ?? 0);
  const showFinance = can(session.role, "finance.read");

  return (
    <div>
      <PageHeader
        title="Bosh sahifa"
        description="Kompaniyaning umumiy holati — bir qarashda."
        actions={
          <>
            {can(session.role, "products.write") && <LinkButton href="/admin/products/new">+ Mahsulot</LinkButton>}
            {can(session.role, "orders.write") && <LinkButton href="/admin/orders/new" variant="secondary">+ Buyurtma</LinkButton>}
            {can(session.role, "stock.write") && <LinkButton href="/admin/stock-documents/new" variant="secondary">+ Ombor hujjati</LinkButton>}
          </>
        }
      />
      {sp.denied && <p className="mb-4 rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-800">Bu bo&apos;limga ruxsatingiz yo&apos;q.</p>}

      {showFinance && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label={`Bugun · ${day._count} ta buyurtma`} value={<Money value={day._sum.total ?? 0} />} href="/admin/analytics" />
          <Stat label={`Shu hafta · ${week._count} ta`} value={<Money value={week._sum.total ?? 0} />} href="/admin/analytics" />
          <Stat label={`Shu oy · ${month._count} ta`} value={<Money value={month._sum.total ?? 0} />} href="/admin/analytics" />
          <Stat label={`Debitorlik · ${unpaid._count} ta buyurtma`} value={<Money value={receivable} />} tone={receivable > 0 ? "warn" : "default"} href="/admin/payments" />
        </div>
      )}

      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {showFinance && (
          <Stat
            label="Ombor qiymati (tannarx)"
            value={<Money value={stockValueCost} />}
            hint={withoutCost > 0 ? `${withoutCost} ta mahsulotda tannarx yo'q · sotuv narxida: ${formatNumber(stockValueRetail)}` : undefined}
            href="/admin/analytics/inventory"
          />
        )}
        <Stat label="Ombordagi birliklar" value={formatNumber(levels._sum.quantity ?? 0)} hint={`Band: ${levels._sum.reserved ?? 0}`} href="/admin/stock" />
        <Stat label="Kam qolgan / tugagan" value={`${low.length} / ${outOfStock}`} tone={low.length + outOfStock > 0 ? "warn" : "good"} href="/admin/stock?filter=low" />
        <Stat label="Yangi arizalar" value={newRfqs} tone={newRfqs > 0 ? "warn" : "default"} href="/admin/requests" />
        <Stat label="Qoralama buyurtmalar" value={pendingOrders} href="/admin/orders?status=DRAFT" />
        <Stat label="Jo'natma kutilmoqda" value={pendingShipments} href="/admin/shipments" />
        <Stat label="Faol mahsulotlar" value={products.length} href="/admin/products" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card title="So'nggi arizalar" actions={<Link href="/admin/requests" className="text-sm text-indigo-600">Barchasi →</Link>}>
          {recentRfqs.length === 0 ? (
            <p className="text-sm text-slate-400">Arizalar yo&apos;q.</p>
          ) : (
            <ul className="divide-y divide-slate-100 text-sm">
              {recentRfqs.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 py-2">
                  <span>
                    <span className="font-medium text-slate-800">{r.companyName}</span>
                    <span className="block text-xs text-slate-400">{r.phone} · {formatDate(r.createdAt, true)}</span>
                  </span>
                  <Badge tone={RFQ_STATUS[r.status].tone}>{RFQ_STATUS[r.status].label}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="So'nggi buyurtmalar" actions={<Link href="/admin/orders" className="text-sm text-indigo-600">Barchasi →</Link>}>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-slate-400">Buyurtmalar yo&apos;q.</p>
          ) : (
            <ul className="divide-y divide-slate-100 text-sm">
              {recentOrders.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3 py-2">
                  <Link href={`/admin/orders/${o.id}`} className="hover:text-indigo-600">
                    <span className="font-medium text-slate-800">{o.number}</span>
                    <span className="block text-xs text-slate-400">{o.customer?.companyName ?? "—"} · {formatDate(o.createdAt)}</span>
                  </Link>
                  <span className="text-right">
                    <Money value={o.total} />
                    <span className="block">
                      <Badge tone={ORDER_STATUS[o.status].tone}>{ORDER_STATUS[o.status].label}</Badge>
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        {low.length > 0 && (
          <Card title="Qayta buyurtma kerak" actions={<Link href="/admin/analytics/inventory" className="text-sm text-indigo-600">Tahlil →</Link>}>
            <ul className="divide-y divide-slate-100 text-sm">
              {low.slice(0, 8).map((p) => (
                <li key={p.id} className="flex justify-between gap-3 py-2">
                  <Link href={`/admin/products/${p.id}/overview`} className="hover:text-indigo-600">{p.name}</Link>
                  <span className="text-amber-600">qoldiq: {p.stock}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </div>
  );
}
