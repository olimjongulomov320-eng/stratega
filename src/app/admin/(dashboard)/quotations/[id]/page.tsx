import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatSum } from "@/lib/format";
import { requirePagePermission } from "@/lib/require-permission";
import { QuotationStatusSelect } from "../status-select";
import { ConvertToOrderButton } from "../convert-button";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Qoralama",
  SENT: "Yuborilgan",
  ACCEPTED: "Qabul qilingan",
  REJECTED: "Rad etilgan",
  EXPIRED: "Muddati tugagan",
};

export default async function QuotationDetailPage(
  props: PageProps<"/admin/quotations/[id]">
) {
  await requirePagePermission("orders.read");

  const { id } = await props.params;
  const quotation = await prisma.quotation.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: { select: { id: true, name: true, sku: true, unit: true, stock: true } },
        },
      },
      customer: true,
      rfqRequest: true,
      order: { select: { id: true, number: true, status: true } },
    },
  });
  if (!quotation) notFound();

  const total = quotation.items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{quotation.number}</h1>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
              {STATUS_LABELS[quotation.status] ?? quotation.status}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {quotation.customer?.companyName ??
              quotation.rfqRequest?.companyName ??
              "Mijozsiz taklif"}
            {" · "}
            {new Date(quotation.createdAt).toLocaleDateString("uz-UZ")} da yaratilgan
            {quotation.validUntil && (
              <>
                {" · "}
                amal qilish muddati:{" "}
                {new Date(quotation.validUntil).toLocaleDateString("uz-UZ")}
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <QuotationStatusSelect id={quotation.id} status={quotation.status} />
          {quotation.status === "ACCEPTED" && !quotation.order && (
            <ConvertToOrderButton id={quotation.id} />
          )}
          {quotation.order && (
            <Link
              href={`/admin/orders/${quotation.order.id}`}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              {quotation.order.number} buyurtmasini ko&apos;rish
            </Link>
          )}
          <Link
            href="/admin/quotations"
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            ← Orqaga
          </Link>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Mahsulot</th>
              <th className="px-4 py-3 text-right">Miqdor</th>
              <th className="px-4 py-3 text-right">Narx</th>
              <th className="px-4 py-3 text-right">Summa</th>
              <th className="px-4 py-3 text-right">Joriy qoldiq</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {quotation.items.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/products/${item.productId}/overview`}
                    className="font-medium text-slate-800 hover:text-indigo-600"
                  >
                    {item.product.name}
                  </Link>
                  {item.product.sku && (
                    <span className="ml-2 text-xs text-slate-400">{item.product.sku}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right text-slate-700">
                  {item.quantity}
                </td>
                <td className="px-4 py-3 text-right text-slate-700">
                  {formatSum(item.price)}
                </td>
                <td className="px-4 py-3 text-right font-medium text-slate-900">
                  {formatSum(item.price * item.quantity)}
                </td>
                <td className="px-4 py-3 text-right text-slate-500">
                  {item.product.stock}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-slate-200 bg-slate-50">
            <tr>
              <td colSpan={3} className="px-4 py-3 text-right text-sm font-semibold text-slate-600">
                Jami
              </td>
              <td className="px-4 py-3 text-right text-base font-black text-slate-900">
                {formatSum(total)}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      {quotation.note && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-700">Izoh</h2>
          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">
            {quotation.note}
          </p>
        </div>
      )}

      {quotation.rfqRequest && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-700">Manba ariza (RFQ)</h2>
          <p className="mt-1 text-sm text-slate-600">
            {quotation.rfqRequest.companyName} · {quotation.rfqRequest.phone}
          </p>
          <Link
            href="/admin/requests"
            className="mt-2 inline-block text-sm font-medium text-indigo-600 hover:underline"
          >
            Arizalar sahifasiga o&apos;tish →
          </Link>
        </div>
      )}
    </div>
  );
}
