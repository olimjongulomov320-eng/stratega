import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { DeleteSupplierButton } from "./delete-button";

export const dynamic = "force-dynamic";

export default async function SuppliersPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const suppliers = await prisma.supplier.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Yetkazib beruvchilar
          </h1>
          <p className="mt-1 text-slate-500">
            Mahsulotlarni kimdan sotib olishingiz — yetkazib beruvchilar
            ro&apos;yxati.
          </p>
        </div>
        <Link
          href="/admin/suppliers/new"
          className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          + Yangi yetkazib beruvchi
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Nomi</th>
              <th className="px-4 py-3">Aloqa</th>
              <th className="px-4 py-3">Mahsulotlar</th>
              <th className="px-4 py-3">Holat</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {suppliers.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-800">{s.name}</p>
                  {s.legalName && (
                    <p className="text-xs text-slate-400">{s.legalName}</p>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {s.contactName && <p>{s.contactName}</p>}
                  {s.phone && <p className="text-xs text-slate-400">{s.phone}</p>}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {s._count.products}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      s.isActive
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {s.isActive ? "Faol" : "Nofaol"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/suppliers/${s.id}`}
                      className="rounded-lg px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
                    >
                      Tahrirlash
                    </Link>
                    <DeleteSupplierButton
                      supplierId={s.id}
                      supplierName={s.name}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {suppliers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  Hozircha yetkazib beruvchilar yo&apos;q.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
