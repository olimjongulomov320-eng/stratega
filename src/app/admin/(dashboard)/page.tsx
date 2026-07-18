import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminDashboardPage() {
  const [productCount, categoryCount, newRequestCount, totalRequestCount] =
    await Promise.all([
      prisma.product.count(),
      prisma.category.count(),
      prisma.rfqRequest.count({ where: { status: "NEW" } }),
      prisma.rfqRequest.count(),
    ]);

  const stats = [
    { label: "Mahsulotlar", value: productCount, href: "/admin/products" },
    { label: "Kategoriyalar", value: categoryCount, href: "/admin/categories" },
    { label: "Yangi arizalar", value: newRequestCount, href: "/admin/requests" },
    { label: "Jami arizalar", value: totalRequestCount, href: "/admin/requests" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Boshqaruv paneli</h1>
      <p className="mt-1 text-slate-500">
        Mahsulotlar, kategoriyalar va arizalarni shu yerdan boshqaring.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-indigo-300 hover:shadow-sm"
          >
            <p className="text-3xl font-black text-slate-900">{stat.value}</p>
            <p className="mt-1 text-sm text-slate-500">{stat.label}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/admin/products/new"
          className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          + Yangi mahsulot qo&apos;shish
        </Link>
        <Link
          href="/admin/categories/new"
          className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-600"
        >
          + Yangi kategoriya qo&apos;shish
        </Link>
      </div>
    </div>
  );
}
