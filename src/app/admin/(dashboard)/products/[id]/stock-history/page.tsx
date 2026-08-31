import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatSum } from "@/lib/format";

const REASON_LABELS: Record<string, string> = {
  MANUAL: "Qo'lda",
  IMPORT: "CSV import",
  ORDER: "Ariza",
};

export default async function StockHistoryPage(
  props: PageProps<"/admin/products/[id]/stock-history">
) {
  const { id } = await props.params;

  const [product, moves, priceMoves] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      select: { name: true, stock: true, price: true },
    }),
    prisma.stockMove.findMany({
      where: { productId: id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.priceHistory.findMany({
      where: { productId: id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!product) notFound();

  return (
    <div>
      <Link
        href={`/admin/products/${id}`}
        className="text-sm font-medium text-indigo-600 hover:underline"
      >
        ← Mahsulotga qaytish
      </Link>

      <h1 className="mt-3 text-2xl font-bold text-slate-900">
        Ombor tarixi — {product.name}
      </h1>
      <p className="mt-1 text-slate-500">
        Hozirgi qoldiq: <span className="font-semibold">{product.stock}</span>
        {" · "}
        Hozirgi narx:{" "}
        <span className="font-semibold">{formatSum(product.price)}</span>
      </p>

      <h2 className="mt-8 text-lg font-semibold text-slate-900">
        Qoldiq tarixi
      </h2>
      <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Sana</th>
              <th className="px-4 py-3">O&apos;zgarish</th>
              <th className="px-4 py-3">Qoldiq</th>
              <th className="px-4 py-3">Sabab</th>
              <th className="px-4 py-3">Izoh</th>
            </tr>
          </thead>
          <tbody className="stock-table-rows divide-y divide-slate-100">
            {moves.map((move) => {
              const isIncoming = move.change > 0;
              const reasonPillClass =
                move.reason === "IMPORT"
                  ? "bg-indigo-50 text-indigo-700"
                  : move.reason === "ORDER"
                    ? isIncoming
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-rose-50 text-rose-700"
                    : "bg-slate-100 text-slate-600";

              return (
                <tr key={move.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(move.createdAt).toLocaleString("uz-UZ")}
                  </td>
                  <td
                    className={`px-4 py-3 font-semibold ${
                      isIncoming ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {isIncoming ? "+" : ""}
                    {move.change}
                  </td>
                  <td
                    className={`px-4 py-3 ${
                      move.stockAfter < 0 ? "text-rose-600" : "text-slate-600"
                    }`}
                  >
                    {move.stockAfter}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${reasonPillClass}`}
                    >
                      {REASON_LABELS[move.reason] ?? move.reason}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {move.note ?? "—"}
                  </td>
                </tr>
              );
            })}
            {moves.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  Hozircha ombor tarixi yo&apos;q.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h2 className="mt-8 text-lg font-semibold text-slate-900">
        Narx tarixi
      </h2>
      <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Sana</th>
              <th className="px-4 py-3">Eski narx</th>
              <th className="px-4 py-3">Yangi narx</th>
              <th className="px-4 py-3">O&apos;zgarish</th>
            </tr>
          </thead>
          <tbody className="stock-table-rows divide-y divide-slate-100">
            {priceMoves.map((move) => {
              const diff = move.newPrice - move.oldPrice;
              const isIncrease = diff > 0;
              return (
                <tr key={move.id} className="transition-colors hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(move.createdAt).toLocaleString("uz-UZ")}
                  </td>
                  <td className="px-4 py-3 text-slate-500 line-through">
                    {formatSum(move.oldPrice)}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {formatSum(move.newPrice)}
                  </td>
                  <td
                    className={`px-4 py-3 font-semibold ${
                      isIncrease ? "text-rose-600" : "text-emerald-600"
                    }`}
                  >
                    {isIncrease ? "↑" : "↓"} {formatSum(Math.abs(diff))}
                  </td>
                </tr>
              );
            })}
            {priceMoves.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                  Hozircha narx tarixi yo&apos;q.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
