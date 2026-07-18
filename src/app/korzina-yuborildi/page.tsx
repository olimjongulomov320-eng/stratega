import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatSum } from "@/lib/format";

export default async function ArizaYuborildiPage(
  props: PageProps<"/korzina-yuborildi">
) {
  const searchParams = await props.searchParams;
  const id = typeof searchParams.id === "string" ? searchParams.id : undefined;

  const request = id
    ? await prisma.rfqRequest.findUnique({
        where: { id },
        include: { items: { include: { product: true } } },
      })
    : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
        ✓
      </div>
      <h1 className="mt-6 text-2xl font-bold text-slate-800">
        Arizangiz qabul qilindi!
      </h1>
      <p className="mt-2 text-slate-500">
        Menejerimiz 30 daqiqa ichida siz bilan bog&apos;lanadi va
        kommertsiya taklifini taqdim etadi.
      </p>

      {request && (
        <div className="mt-8 rounded-2xl border border-slate-100 bg-slate-50 p-6 text-left">
          <p className="text-sm text-slate-500">
            Ariza raqami:{" "}
            <span className="font-mono text-slate-700">{request.id}</span>
          </p>
          <ul className="mt-4 space-y-1 text-sm text-slate-600">
            {request.items.map((item) => (
              <li key={item.id} className="flex justify-between">
                <span>
                  {item.product.name} × {item.quantity}
                </span>
                <span>{formatSum(item.priceAtQuote * item.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 font-bold text-slate-900">
            <span>Taxminiy summa</span>
            <span>
              {formatSum(
                request.items.reduce(
                  (sum, i) => sum + i.priceAtQuote * i.quantity,
                  0
                )
              )}
            </span>
          </div>
        </div>
      )}

      <Link
        href="/"
        className="mt-8 inline-block rounded-full bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700"
      >
        Katalogga qaytish
      </Link>
    </div>
  );
}
