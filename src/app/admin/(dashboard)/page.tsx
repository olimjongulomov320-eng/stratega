import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatSum } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [
    productCount,
    customerCount,
    supplierCount,
    newRequestCount,
    pendingOrderCount,
    products,
    recentOrders,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.customer.count({ where: { isActive: true } }),
    prisma.supplier.count({ where: { isActive: true } }),
    prisma.rfqRequest.count({ where: { status: "NEW" } }),
    prisma.order.count({
      where: { status: { in: ["DRAFT", "CONFIRMED", "PROCESSING"] } },
    }),
    prisma.product.findMany({ select: { stock: true, price: true, isActive: true } }),
    prisma.order.findMany({
      where: { status: { not: "CANCELLED" } },
      include: { items: { select: { quantity: true, price: true } } },
    }),
  ]);

  const inventoryValue = products.reduce((s, p) => s + p.stock * p.price, 0);
  const outOfStockCount = products.filter((p) => p.stock <= 0).length;
  const lowStockCount = products.filter(
    (p) => p.stock > 0 && p.stock <= 5
  ).length;

  const totalRevenue = recentOrders.reduce(
    (sum, o) => sum + o.items.reduce((s, i) => s + i.price * i.quantity, 0),
    0
  );

  const kpis = [
    { label: "Mahsulotlar", value: String(productCount), href: "/admin/products" },
    { label: "Ombor qiymati", value: formatSum(inventoryValue), href: "/admin/stock" },
    { label: "Faol mijozlar", value: String(customerCount), href: "/admin/customers" },
    {
      label: "Yetkazib beruvchilar",
      value: String(supplierCount),
      href: "/admin/suppliers",
    },
    { label: "Jami savdo (yakunlanmagan)", value: formatSum(totalRevenue), href: "/admin/orders" },
    { label: "Kutilayotgan buyurtmalar", value: String(pendingOrderCount), href: "/admin/orders" },
    { label: "Yangi arizalar", value: String(newRequestCount), href: "/admin/requests" },
    { label: "Kam qolgan mahsulotlar", value: String(lowStockCount), href: "/admin/stock" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Boshqaruv paneli</h1>
      <p className="mt-1 text-slate-500">
        Kompaniyaning umumiy holati — bir qarashda.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-xl border border-slate-200 bg-white p-5 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md"
          >
            <p className="text-2xl font-black text-slate-900">{stat.value}</p>
            <p className="mt-1 text-sm text-slate-500">{stat.label}</p>
          </Link>
        ))}
      </div>

      {outOfStockCount > 0 && (
        <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          🔴 {outOfStockCount} ta mahsulot tugagan —{" "}
          <Link href="/admin/stock" className="font-semibold underline">
            Skladni ko&apos;rish
          </Link>
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
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
      </div>
    </div>
  );
}
