import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<string, string> = {
  RECEIPT: "Kirim",
  ISSUE: "Chiqim",
  TRANSFER: "Ko'chirish",
  WRITE_OFF: "Hisobdan chiqarish",
  INVENTORY: "Inventarizatsiya",
  RETURN: "Qaytarish",
};

const STATUS_STYLE: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  POSTED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-rose-50 text-rose-700",
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Qoralama",
  POSTED: "Проведено",
  CANCELLED: "Bekor qilingan",
};

export default async function StockDocumentsPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const documents = await prisma.stockDocument.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      warehouse: { select: { name: true } },
      destWarehouse: { select: { name: true } },
      supplier: { select: { name: true } },
      _count: { select: { items: true } },
    },
    take: 100,
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Ombor hujjatlari
          </h1>
          <p className="mt-1 text-slate-500">
            Kirim, chiqim, ko&apos;chirish, hisobdan chiqarish va
            inventarizatsiya hujjatlari.
          </p>
        </div>
        <Link
          href="/admin/stock-documents/new"
          className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          + Yangi hujjat
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Raqam</th>
              <th className="px-4 py-3">Turi</th>
              <th className="px-4 py-3">Ombor</th>
              <th className="px-4 py-3">Qatorlar</th>
              <th className="px-4 py-3">Holat</th>
              <th className="px-4 py-3">Sana</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {documents.map((doc) => (
              <tr key={doc.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800">
                  {doc.number}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {TYPE_LABELS[doc.type] ?? doc.type}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {doc.warehouse.name}
                  {doc.destWarehouse && ` → ${doc.destWarehouse.name}`}
                  {doc.supplier && ` (${doc.supplier.name})`}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {doc._count.items}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[doc.status]}`}
                  >
                    {STATUS_LABELS[doc.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {new Date(doc.createdAt).toLocaleString("uz-UZ")}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/stock-documents/${doc.id}`}
                    className="rounded-lg px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
                  >
                    Ko&apos;rish
                  </Link>
                </td>
              </tr>
            ))}
            {documents.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                  Hozircha hujjatlar yo&apos;q.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
