import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatSum } from "@/lib/format";
import { requirePagePermission } from "@/lib/require-permission";
import { CsvExportButton } from "@/components/csv-export-button";
import { QuotationStatusSelect } from "./status-select";
import { ConvertToOrderButton } from "./convert-button";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Qoralama",
  SENT: "Yuborilgan",
  ACCEPTED: "Qabul qilingan",
  REJECTED: "Rad etilgan",
  EXPIRED: "Muddati tugagan",
};

const STATUS_STYLE: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  SENT: "bg-indigo-50 text-indigo-700",
  ACCEPTED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-rose-50 text-rose-700",
  EXPIRED: "bg-amber-50 text-amber-700",
};

export default async function QuotationsPage() {
  await requirePagePermission("orders.read");

  const quotations = await prisma.quotation.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      items: { select: { quantity: true, price: true } },
      customer: { select: { companyName: true } },
      rfqRequest: { select: { companyName: true } },
      order: { select: { id: true, number: true } },
    },
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Takliflar</h1>
          <p className="mt-1 text-slate-500">
            Mijozlarga narx taklifi — RFQ dan keyingi bosqich.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CsvExportButton
            filename="takliflar"
            header={["Raqam", "Mijoz", "Summa", "Holat", "Muddat", "Buyurtma", "Sana"]}
            rows={quotations.map((q) => [
              q.number,
              q.customer?.companyName ?? q.rfqRequest?.companyName ?? "",
              String(q.items.reduce((s, i) => s + i.price * i.quantity, 0)),
              STATUS_LABELS[q.status] ?? q.status,
              q.validUntil ? q.validUntil.toLocaleDateString("uz-UZ") : "",
              q.order?.number ?? "",
              q.createdAt.toLocaleDateString("uz-UZ"),
            ])}
          />
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Raqam</th>
              <th className="px-4 py-3">Mijoz</th>
              <th className="px-4 py-3 text-right">Summa</th>
              <th className="px-4 py-3">Holat</th>
              <th className="px-4 py-3">Muddat</th>
              <th className="px-4 py-3">Buyurtma</th>
              <th className="px-4 py-3">Amallar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {quotations.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                  Takliflar yo&apos;q. Ariza (RFQ) sahifasidan yarating.
                </td>
              </tr>
            )}
            {quotations.map((q) => {
              const total = q.items.reduce((s, i) => s + i.price * i.quantity, 0);
              return (
                <tr key={q.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-slate-800">
                    <Link href={`/admin/quotations/${q.id}`} className="hover:text-indigo-600">
                      {q.number}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {q.customer?.companyName ?? q.rfqRequest?.companyName ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-slate-800">
                    {formatSum(total)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        STATUS_STYLE[q.status] ?? "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {STATUS_LABELS[q.status] ?? q.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {q.validUntil ? q.validUntil.toLocaleDateString("uz-UZ") : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {q.order ? (
                      <Link
                        href={`/admin/orders/${q.order.id}`}
                        className="font-medium text-indigo-600 hover:underline"
                      >
                        {q.order.number}
                      </Link>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <QuotationStatusSelect id={q.id} status={q.status} />
                      {q.status === "ACCEPTED" && !q.order && (
                        <ConvertToOrderButton id={q.id} />
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
