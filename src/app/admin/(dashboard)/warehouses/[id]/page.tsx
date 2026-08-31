import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { formatSum } from "@/lib/format";
import { WarehouseForm } from "../warehouse-form";

export const dynamic = "force-dynamic";

export default async function WarehouseDetailPage(
  props: PageProps<"/admin/warehouses/[id]">
) {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const { id } = await props.params;
  const warehouse = await prisma.warehouse.findUnique({
    where: { id },
    include: {
      stocks: {
        include: { product: { select: { name: true, price: true, sku: true } } },
        orderBy: { quantity: "asc" },
      },
    },
  });
  if (!warehouse) notFound();

  const totalUnits = warehouse.stocks.reduce((s, x) => s + x.quantity, 0);
  const totalValue = warehouse.stocks.reduce(
    (s, x) => s + x.quantity * x.product.price,
    0
  );
  const lowStockCount = warehouse.stocks.filter(
    (s) => s.quantity > 0 && s.quantity <= 5
  ).length;
  const reservedCount = warehouse.stocks.filter((s) => s.reserved > 0).length;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">{warehouse.name}</h1>
      <p className="mt-1 text-slate-500">{warehouse.address ?? warehouse.code}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Jami birlik", value: String(totalUnits) },
          { label: "Ombor qiymati", value: formatSum(totalValue) },
          { label: "Kam qolganlar", value: String(lowStockCount) },
          { label: "Band qilinganlar", value: String(reservedCount) },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-xl border border-slate-200 bg-white p-5"
          >
            <p className="text-2xl font-black text-slate-900">{kpi.value}</p>
            <p className="mt-1 text-sm text-slate-500">{kpi.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-1">
          <h2 className="text-lg font-semibold text-slate-900">
            Ombor ma&apos;lumotlari
          </h2>
          <div className="mt-4">
            <WarehouseForm
              warehouseId={warehouse.id}
              initialValues={{
                name: warehouse.name,
                code: warehouse.code,
                address: warehouse.address ?? "",
                description: warehouse.description ?? "",
                isActive: warehouse.isActive,
              }}
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white lg:col-span-2">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Mahsulot</th>
                <th className="px-4 py-3">Mavjud</th>
                <th className="px-4 py-3">Band</th>
                <th className="px-4 py-3">Sotuvga tayyor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {warehouse.stocks.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">
                      {s.product.name}
                    </p>
                    {s.product.sku && (
                      <p className="text-xs text-slate-400">{s.product.sku}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{s.quantity}</td>
                  <td className="px-4 py-3 text-slate-600">{s.reserved}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {s.quantity - s.reserved}
                  </td>
                </tr>
              ))}
              {warehouse.stocks.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                    Bu omborda hali mahsulot yo&apos;q.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
