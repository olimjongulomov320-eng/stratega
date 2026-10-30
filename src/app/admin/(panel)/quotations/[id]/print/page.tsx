import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePage } from "@/lib/admin";
import { formatDate, formatNumber } from "@/lib/format";
import { COMPANY } from "@/lib/site";
import { PrintButton } from "./print-button";

// Printable commercial offer (КП) in Russian — the language used for B2B documents.
export default async function PrintQuotation(props: PageProps<"/admin/quotations/[id]/print">) {
  await requirePage("orders.read");
  const { id } = await props.params;
  const q = await prisma.quotation.findUnique({ where: { id }, include: { customer: true, lines: { include: { product: true } } } });
  if (!q) notFound();
  const vat = Math.round((q.total * 12) / 112);
  return (
    <div className="mx-auto max-w-3xl bg-white p-10 text-[13px] text-black print:p-0">
      <div className="mb-6 flex justify-between print:hidden"><PrintButton /></div>
      <div className="flex justify-between border-b-2 border-black pb-3">
        <div>
          <p className="text-xl font-black">{COMPANY.brand}</p>
          <p>{COMPANY.legalName} · ИНН {COMPANY.inn}</p>
          <p>{COMPANY.address.ru}</p>
          <p>{COMPANY.phone} · {COMPANY.email} · stratega.uz</p>
        </div>
        <div className="text-right">
          <p className="font-bold">Коммерческое предложение</p>
          <p>№ {q.number}</p>
          <p>от {formatDate(q.createdAt)}</p>
        </div>
      </div>
      <p className="mt-4">Кому: <b>{q.customer?.companyName ?? "—"}</b>{q.customer?.inn ? `, ИНН ${q.customer.inn}` : ""}</p>
      <table className="mt-4 w-full border-collapse">
        <thead><tr className="border-b border-black text-left"><th className="py-1">№</th><th>Наименование</th><th className="text-right">Кол-во</th><th className="text-right">Цена, сум</th><th className="text-right">Сумма, сум</th></tr></thead>
        <tbody>
          {q.lines.map((l, i) => (
            <tr key={l.id} className="border-b border-slate-300">
              <td className="py-1">{i + 1}</td>
              <td>{l.product.nameRu ?? l.product.name}{l.product.sku ? ` (${l.product.sku})` : ""}</td>
              <td className="text-right">{l.quantity}</td>
              <td className="text-right">{formatNumber(l.price)}</td>
              <td className="text-right">{formatNumber(l.price * l.quantity)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-right text-base font-bold">Итого: {formatNumber(q.total)} сум</p>
      <p className="text-right">в т. ч. НДС 12%: {formatNumber(vat)} сум</p>
      {q.validUntil && <p className="mt-4">Предложение действительно до {formatDate(q.validUntil)}.</p>}
      {q.note && <p className="mt-2">Примечание: {q.note}</p>}
      <p className="mt-10">Директор ____________________</p>
    </div>
  );
}
