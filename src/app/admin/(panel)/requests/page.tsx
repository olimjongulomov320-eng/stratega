import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePage } from "@/lib/admin";
import { can } from "@/lib/permissions";
import { PageHeader, Badge, Money, Filters, inputCls, btn, Empty } from "@/components/admin/ui";
import { ActionForm, ActionButton, Submit } from "@/components/admin/forms";
import { formatDate } from "@/lib/format";
import { RFQ_STATUS } from "@/lib/labels";
import { setRfqStatus, quoteFromRfq } from "./actions";
import type { RfqStatus } from "@/generated/prisma/client";

export default async function RequestsPage(props: PageProps<"/admin/requests">) {
  const session = await requirePage("orders.read");
  const sp = await props.searchParams;
  const status = typeof sp.status === "string" && sp.status in RFQ_STATUS ? (sp.status as RfqStatus) : undefined;
  const requests = await prisma.rfqRequest.findMany({
    where: status ? { status } : {},
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { items: { include: { product: true } }, quotations: { select: { id: true, number: true } } },
  });
  const canWrite = can(session.role, "orders.write");
  return (
    <div>
      <PageHeader title="Arizalar (RFQ)" description="Saytdan kelgan tijorat taklifi so'rovlari." />
      <Filters>
        <select name="status" defaultValue={status ?? ""} className={`${inputCls} max-w-xs`}>
          <option value="">Barcha holatlar</option>
          {Object.entries(RFQ_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <button className={btn("secondary")}>Ko&apos;rsatish</button>
      </Filters>
      {requests.length === 0 ? (
        <Empty>Arizalar yo&apos;q.</Empty>
      ) : (
        <div className="flex flex-col gap-3">
          {requests.map((r) => {
            const total = r.items.reduce((s, i) => s + i.priceAtQuote * i.quantity, 0);
            return (
              <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-800">{r.companyName}</p>
                    <p className="text-sm text-slate-500">
                      {r.contactName !== r.companyName ? `${r.contactName} · ` : ""}
                      <a href={`tel:${r.phone.replace(/[^\d+]/g, "")}`} className="text-indigo-600">{r.phone}</a> · {formatDate(r.createdAt, true)} · {r.requestType} · {r.locale.toUpperCase()}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={RFQ_STATUS[r.status].tone}>{RFQ_STATUS[r.status].label}</Badge>
                    {canWrite && (
                      <ActionForm action={setRfqStatus} className="flex items-center gap-1">
                        <input type="hidden" name="id" value={r.id} />
                        <select name="status" defaultValue={r.status} className="rounded-lg border border-slate-200 px-2 py-1 text-xs">
                          {Object.entries(RFQ_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                        <Submit size="sm" variant="secondary">OK</Submit>
                      </ActionForm>
                    )}
                  </div>
                </div>
                {r.comment && <p className="mt-2 whitespace-pre-line rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{r.comment}</p>}
                {r.items.length > 0 && (
                  <ul className="mt-3 space-y-1 text-sm">
                    {r.items.map((i) => (
                      <li key={i.id} className="flex justify-between gap-3">
                        <span>{i.product.name} × {i.quantity}</span>
                        <Money value={i.priceAtQuote * i.quantity} />
                      </li>
                    ))}
                    <li className="flex justify-between border-t border-slate-100 pt-1 font-semibold"><span>Taxminiy summa</span><Money value={total} /></li>
                  </ul>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {r.quotations.map((q) => <Link key={q.id} href={`/admin/quotations/${q.id}`} className="text-sm text-indigo-600">{q.number} →</Link>)}
                  {canWrite && <ActionButton action={quoteFromRfq} fields={{ id: r.id }} variant="primary">Taklif (KP) yaratish</ActionButton>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
