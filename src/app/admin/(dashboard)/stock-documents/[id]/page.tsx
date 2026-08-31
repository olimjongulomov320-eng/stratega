import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { formatSum } from "@/lib/format";
import { DocumentActions } from "../document-actions";

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

export default async function StockDocumentDetailPage(
  props: PageProps<"/admin/stock-documents/[id]">
) {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const { id } = await props.params;
  const doc = await prisma.stockDocument.findUnique({
    where: { id },
    include: {
      warehouse: true,
      destWarehouse: true,
      supplier: true,
      responsible: true,
      items: { include: { product: { select: { name: true, sku: true } } } },
    },
  });
  if (!doc) notFound();

  return (
    <div>
      <Link
        href="/admin/stock-documents"
        className="text-sm font-medium text-indigo-600 hover:underline"
      >
        ← Hujjatlarga qaytish
      </Link>

      <div className="mt-3 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{doc.number}</h1>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[doc.status]}`}
            >
              {STATUS_LABELS[doc.status]}
            </span>
          </div>
          <p className="mt-1 text-slate-500">
            {TYPE_LABELS[doc.type]} · {doc.warehouse.name}
            {doc.destWarehouse && ` → ${doc.destWarehouse.name}`}
            {doc.supplier && ` · ${doc.supplier.name}`}
          </p>
        </div>
        <DocumentActions documentId={doc.id} status={doc.status} />
      </div>

      {doc.note && (
        <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
          {doc.note}
        </p>
      )}

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Mahsulot</th>
              <th className="px-4 py-3">Miqdor</th>
              <th className="px-4 py-3">Narx</th>
              <th className="px-4 py-3">Jami</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {doc.items.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-800">
                    {item.product.name}
                  </p>
                  {item.product.sku && (
                    <p className="text-xs text-slate-400">
                      {item.product.sku}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600">{item.quantity}</td>
                <td className="px-4 py-3 text-slate-600">
                  {item.price ? formatSum(item.price) : "—"}
                </td>
                <td className="px-4 py-3 font-medium text-slate-800">
                  {item.price ? formatSum(item.price * item.quantity) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-xs text-slate-400">
        Yaratildi: {new Date(doc.createdAt).toLocaleString("uz-UZ")}
        {doc.postedAt && (
          <> · Проведено: {new Date(doc.postedAt).toLocaleString("uz-UZ")}</>
        )}
        {doc.responsible && <> · Mas&apos;ul: {doc.responsible.name}</>}
      </div>
    </div>
  );
}
