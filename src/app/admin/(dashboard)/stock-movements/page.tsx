import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePagePermission } from "@/lib/require-permission";
import { CsvExportButton } from "@/components/csv-export-button";

export const dynamic = "force-dynamic";

const REASON_LABELS: Record<string, string> = {
  MANUAL: "Qo'lda tuzatish",
  IMPORT: "CSV import",
  ORDER: "Buyurtma (eski oqim)",
  RECEIPT: "Kirim",
  ISSUE: "Chiqim",
  RETURN: "Qaytarish",
  TRANSFER_IN: "Ko'chirish (kirim)",
  TRANSFER_OUT: "Ko'chirish (chiqim)",
  WRITE_OFF: "Hisobdan chiqarish",
  INVENTORY_ADJUSTMENT: "Inventarizatsiya",
};

const REASON_STYLE: Record<string, string> = {
  MANUAL: "bg-slate-100 text-slate-600",
  IMPORT: "bg-sky-50 text-sky-700",
  ORDER: "bg-slate-100 text-slate-600",
  RECEIPT: "bg-emerald-50 text-emerald-700",
  ISSUE: "bg-amber-50 text-amber-700",
  RETURN: "bg-teal-50 text-teal-700",
  TRANSFER_IN: "bg-indigo-50 text-indigo-700",
  TRANSFER_OUT: "bg-indigo-50 text-indigo-700",
  WRITE_OFF: "bg-rose-50 text-rose-700",
  INVENTORY_ADJUSTMENT: "bg-violet-50 text-violet-700",
};

const PAGE_SIZE = 50;

function toInt(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

export default async function StockMovementsPage(
  props: PageProps<"/admin/stock-movements">
) {
  await requirePagePermission("stock.read");

  const sp = await props.searchParams;
  const page = toInt(sp.page, 1);
  const reason = typeof sp.reason === "string" ? sp.reason : "";
  const warehouseId = typeof sp.warehouse === "string" ? sp.warehouse : "";
  const query = typeof sp.q === "string" ? sp.q.trim() : "";

  const where = {
    ...(reason ? { reason: reason as never } : {}),
    ...(warehouseId ? { warehouseId } : {}),
    ...(query
      ? {
          product: {
            OR: [
              { name: { contains: query, mode: "insensitive" as const } },
              { sku: { contains: query, mode: "insensitive" as const } },
              { barcode: { contains: query, mode: "insensitive" as const } },
            ],
          },
        }
      : {}),
  };

  const [total, moves, warehouses] = await Promise.all([
    prisma.stockMove.count({ where }),
    prisma.stockMove.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        product: { select: { name: true, sku: true, unit: true } },
        warehouse: { select: { name: true } },
      },
    }),
    prisma.warehouse.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function pageHref(nextPage: number, nextReason: string, nextWarehouse: string, nextQuery: string) {
    const params = new URLSearchParams();
    if (nextPage > 1) params.set("page", String(nextPage));
    if (nextReason) params.set("reason", nextReason);
    if (nextWarehouse) params.set("warehouse", nextWarehouse);
    if (nextQuery) params.set("q", nextQuery);
    const qs = params.toString();
    return `/admin/stock-movements${qs ? `?${qs}` : ""}`;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Ombor harakatlari</h1>
          <p className="mt-1 text-slate-500">
            Barcha qoldiq o&apos;zgarishlarining yagona, o&apos;zgartirib bo&apos;lmaydigan
            jurnali (StockMove daftar).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CsvExportButton
            filename="ombor-harakatlari"
            header={["Sana", "Mahsulot", "SKU", "Ombor", "O'zgarish", "Qoldiq", "Sabab", "Izoh"]}
            rows={moves.map((m) => [
              m.createdAt.toLocaleString("uz-UZ"),
              m.product.name,
              m.product.sku ?? "",
              m.warehouse?.name ?? "",
              String(m.change),
              String(m.stockAfter),
              REASON_LABELS[m.reason] ?? m.reason,
              m.note ?? "",
            ])}
          />
          <Link
            href="/admin/stock-documents/new"
            className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            + Yangi hujjat
          </Link>
        </div>
      </div>

      {/* Filtrlar */}
      <form
        method="get"
        className="mt-6 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3"
      >
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="Mahsulot, SKU yoki shtrix-kod"
          className="w-56 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
        />
        <select
          name="reason"
          defaultValue={reason}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
        >
          <option value="">Barcha sabablar</option>
          {Object.entries(REASON_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          name="warehouse"
          defaultValue={warehouseId}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
        >
          <option value="">Barcha omborlar</option>
          {warehouses.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Filtrlang
        </button>
        <span className="ml-auto text-xs text-slate-400">{total} ta yozuv</span>
      </form>

      {/* Jadval */}
      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Sana</th>
              <th className="px-4 py-3">Mahsulot</th>
              <th className="px-4 py-3">Ombor</th>
              <th className="px-4 py-3 text-right">O&apos;zgarish</th>
              <th className="px-4 py-3 text-right">Qoldiq</th>
              <th className="px-4 py-3">Sabab</th>
              <th className="px-4 py-3">Izoh</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {moves.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                  Harakatlar topilmadi.
                </td>
              </tr>
            )}
            {moves.map((m) => (
              <tr key={m.id} className="hover:bg-slate-50">
                <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                  {m.createdAt.toLocaleString("uz-UZ")}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/products/${m.productId}/stock-history`}
                    className="font-medium text-slate-800 hover:text-indigo-600"
                  >
                    {m.product.name}
                  </Link>
                  {m.product.sku && (
                    <span className="ml-2 text-xs text-slate-400">{m.product.sku}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {m.warehouse?.name ?? "—"}
                </td>
                <td
                  className={`px-4 py-3 text-right font-semibold ${
                    m.change >= 0 ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {m.change >= 0 ? `+${m.change}` : m.change}
                </td>
                <td className="px-4 py-3 text-right text-slate-700">{m.stockAfter}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      REASON_STYLE[m.reason] ?? "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {REASON_LABELS[m.reason] ?? m.reason}
                  </span>
                </td>
                <td className="max-w-[16rem] truncate px-4 py-3 text-xs text-slate-500">
                  {m.note ?? m.referenceType ?? ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Sahifalash */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <Link
            href={pageHref(page - 1, reason, warehouseId, query)}
            className={`rounded-lg border border-slate-200 bg-white px-4 py-2 font-medium ${
              page <= 1
                ? "pointer-events-none text-slate-300"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            ← Oldingi
          </Link>
          <span className="text-slate-500">
            {page} / {totalPages}
          </span>
          <Link
            href={pageHref(page + 1, reason, warehouseId, query)}
            className={`rounded-lg border border-slate-200 bg-white px-4 py-2 font-medium ${
              page >= totalPages
                ? "pointer-events-none text-slate-300"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            Keyingi →
          </Link>
        </div>
      )}

      <p className="mt-6 text-xs text-slate-400">
        Har bir yozuv tranzaksiya ichida yaratilgan va o&apos;zgartirib bo&apos;lmaydi —
        tuzatishlar faqat yangi harakat orqali amalga oshiriladi.
      </p>
    </div>
  );
}
