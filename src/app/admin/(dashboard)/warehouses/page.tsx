import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { formatSum } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function WarehousesPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const warehouses = await prisma.warehouse.findMany({
    orderBy: { name: "asc" },
    include: {
      stocks: {
        select: {
          quantity: true,
          reserved: true,
          product: { select: { price: true } },
        },
      },
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Omborlar</h1>
          <p className="mt-1 text-slate-500">
            Kompaniyaning barcha ombor manzillari.
          </p>
        </div>
        <Link
          href="/admin/warehouses/new"
          className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          + Yangi ombor
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {warehouses.map((wh) => {
          const totalUnits = wh.stocks.reduce((s, x) => s + x.quantity, 0);
          const totalReserved = wh.stocks.reduce((s, x) => s + x.reserved, 0);
          const totalValue = wh.stocks.reduce(
            (s, x) => s + x.quantity * x.product.price,
            0
          );
          const productCount = wh.stocks.filter((s) => s.quantity > 0).length;

          return (
            <Link
              key={wh.id}
              href={`/admin/warehouses/${wh.id}`}
              className="rounded-xl border border-slate-200 bg-white p-5 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-slate-900">{wh.name}</h2>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    wh.isActive
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {wh.isActive ? "Faol" : "Nofaol"}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-400">{wh.code}</p>
              {wh.address && (
                <p className="mt-1 text-sm text-slate-500">{wh.address}</p>
              )}

              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-sm">
                <div>
                  <p className="text-slate-400">Mahsulotlar</p>
                  <p className="font-semibold text-slate-800">{productCount}</p>
                </div>
                <div>
                  <p className="text-slate-400">Jami birlik</p>
                  <p className="font-semibold text-slate-800">{totalUnits}</p>
                </div>
                <div>
                  <p className="text-slate-400">Band qilingan</p>
                  <p className="font-semibold text-slate-800">{totalReserved}</p>
                </div>
                <div>
                  <p className="text-slate-400">Qiymati</p>
                  <p className="font-semibold text-slate-800">
                    {formatSum(totalValue)}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}

        {warehouses.length === 0 && (
          <div className="col-span-full rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-400">
            Hozircha omborlar yo&apos;q.
          </div>
        )}
      </div>
    </div>
  );
}
