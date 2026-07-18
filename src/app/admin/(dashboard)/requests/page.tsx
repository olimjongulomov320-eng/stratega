import { prisma } from "@/lib/prisma";
import { formatSum } from "@/lib/format";
import { StatusSelect } from "./status-select";

export default async function AdminRequestsPage() {
  const requests = await prisma.rfqRequest.findMany({
    include: { items: { include: { product: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Arizalar</h1>
      <p className="mt-1 text-slate-500">
        Mijozlardan kelgan spetsifikatsiya so&apos;rovlari.
      </p>

      <div className="mt-6 flex flex-col gap-4">
        {requests.map((request) => {
          const total = request.items.reduce(
            (sum, i) => sum + i.priceAtQuote * i.quantity,
            0
          );
          return (
            <div
              key={request.id}
              className="rounded-xl border border-slate-200 bg-white p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-800">
                    {request.companyName}
                  </p>
                  <p className="text-sm text-slate-500">
                    {request.contactName} · {request.phone}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {new Date(request.createdAt).toLocaleString("uz-UZ")} ·{" "}
                    {request.requestType}
                  </p>
                </div>
                <StatusSelect requestId={request.id} status={request.status} />
              </div>

              {request.comment && (
                <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                  {request.comment}
                </p>
              )}

              {request.items.length > 0 && (
                <ul className="mt-3 space-y-1 text-sm text-slate-600">
                  {request.items.map((item) => (
                    <li key={item.id} className="flex justify-between">
                      <span>
                        {item.product.name} × {item.quantity}
                      </span>
                      <span>{formatSum(item.priceAtQuote * item.quantity)}</span>
                    </li>
                  ))}
                </ul>
              )}

              {total > 0 && (
                <div className="mt-3 flex justify-between border-t border-slate-100 pt-3 text-sm font-semibold text-slate-800">
                  <span>Taxminiy summa</span>
                  <span>{formatSum(total)}</span>
                </div>
              )}
            </div>
          );
        })}

        {requests.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-400">
            Hozircha arizalar yo&apos;q.
          </div>
        )}
      </div>
    </div>
  );
}
