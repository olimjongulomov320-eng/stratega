import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { formatSum } from "@/lib/format";
import { DeleteCustomerButton } from "./delete-button";
import { CsvExportButton } from "@/components/csv-export-button";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const customers = await prisma.customer.findMany({
    orderBy: { companyName: "asc" },
    include: { _count: { select: { orders: true } }, priceList: true },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mijozlar</h1>
          <p className="mt-1 text-slate-500">
            B2B mijozlar ro&apos;yxati (sayt orqali kiruvchi
            foydalanuvchilardan alohida).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CsvExportButton
            filename="mijozlar"
            header={["Kompaniya", "Aloqa shaxsi", "Telefon", "Kredit limiti", "Holat"]}
            rows={customers.map((c) => [
              c.companyName,
              c.contactName ?? "",
              c.phone ?? "",
              c.creditLimit ? String(c.creditLimit) : "",
              c.isActive ? "Faol" : "Nofaol",
            ])}
          />
          <Link
            href="/admin/customers/new"
            className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            + Yangi mijoz
          </Link>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Kompaniya</th>
              <th className="px-4 py-3">Aloqa</th>
              <th className="px-4 py-3">Narx ro&apos;yxati</th>
              <th className="px-4 py-3">Kredit limiti</th>
              <th className="px-4 py-3">Buyurtmalar</th>
              <th className="px-4 py-3">Holat</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {customers.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800">
                  {c.companyName}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {c.contactName && <p>{c.contactName}</p>}
                  {c.phone && <p className="text-xs text-slate-400">{c.phone}</p>}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {c.priceList?.name ?? "—"}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {c.creditLimit ? formatSum(c.creditLimit) : "—"}
                </td>
                <td className="px-4 py-3 text-slate-600">{c._count.orders}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      c.isActive
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {c.isActive ? "Faol" : "Nofaol"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/customers/${c.id}`}
                      className="rounded-lg px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
                    >
                      Tahrirlash
                    </Link>
                    <DeleteCustomerButton
                      customerId={c.id}
                      customerName={c.companyName}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                  Hozircha mijozlar yo&apos;q.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
