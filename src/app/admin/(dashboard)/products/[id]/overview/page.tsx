import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatSum } from "@/lib/format";
import { getInventoryForecast, getSupplierPrices } from "@/lib/inventory-assistant";

export const dynamic = "force-dynamic";

const UNIT_LABELS: Record<string, string> = {
  PIECE: "dona",
  SET: "to'plam",
  KG: "kg",
  METER: "metr",
  LITER: "litr",
  PALLET: "pallet",
  BOX: "quti",
};

export default async function ProductOverviewPage(
  props: PageProps<"/admin/products/[id]/overview">
) {
  const { id } = await props.params;

  const [product, stocks, recentPriceHistory, forecast, supplierPrices] =
    await Promise.all([
      prisma.product.findUnique({
        where: { id },
        include: { category: { select: { name: true } } },
      }),
      prisma.stock.findMany({
        where: { productId: id },
        include: { warehouse: { select: { name: true } } },
      }),
      prisma.priceHistory.findMany({
        where: { productId: id },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      getInventoryForecast(),
      getSupplierPrices(id),
    ]);

  if (!product) notFound();

  const productForecast = forecast.find((f) => f.productId === id);
  const totalQuantity = stocks.reduce((s, x) => s + x.quantity, 0);
  const totalReserved = stocks.reduce((s, x) => s + x.reserved, 0);
  const available = totalQuantity - totalReserved;
  const inventoryValue = totalQuantity * product.price;
  const margin =
    product.costPrice && product.price > 0
      ? ((product.price - product.costPrice) / product.price) * 100
      : null;

  return (
    <div>
      <Link
        href={`/admin/products/${id}`}
        className="text-sm font-medium text-indigo-600 hover:underline"
      >
        ← Tahrirlashga qaytish
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">
              {product.name}
            </h1>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                product.isActive
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {product.isActive ? "Faol" : "Nofaol"}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {product.category.name}
            {product.sku && <> · SKU: {product.sku}</>}
            {product.barcode && <> · Shtrix-kod: {product.barcode}</>}
            {" · "}
            {UNIT_LABELS[product.unit]}
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href={`/admin/products/${id}`}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Tahrirlash
          </Link>
          <Link
            href={`/admin/products/${id}/stock-history`}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Tarix
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-2xl font-black text-slate-900">{totalQuantity}</p>
          <p className="mt-1 text-sm text-slate-500">Jami qoldiq</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-2xl font-black text-slate-900">{totalReserved}</p>
          <p className="mt-1 text-sm text-slate-500">Band qilingan</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-2xl font-black text-slate-900">{available}</p>
          <p className="mt-1 text-sm text-slate-500">Sotuvga tayyor</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-2xl font-black text-slate-900">
            {formatSum(inventoryValue)}
          </p>
          <p className="mt-1 text-sm text-slate-500">Ombor qiymati</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-2xl font-black text-slate-900">
            {formatSum(product.price)}
          </p>
          <p className="mt-1 text-sm text-slate-500">Sotuv narxi</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-2xl font-black text-slate-900">
            {product.costPrice ? formatSum(product.costPrice) : "—"}
          </p>
          <p className="mt-1 text-sm text-slate-500">Tannarx</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p
            className={`text-2xl font-black ${
              margin === null
                ? "text-slate-900"
                : margin >= 0
                  ? "text-emerald-600"
                  : "text-rose-600"
            }`}
          >
            {margin !== null ? `${margin.toFixed(1)}%` : "—"}
          </p>
          <p className="mt-1 text-sm text-slate-500">Marja</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-2xl font-black text-slate-900">
            {productForecast?.daysUntilStockout !== null &&
            productForecast?.daysUntilStockout !== undefined
              ? `${Math.ceil(productForecast.daysUntilStockout)} kun`
              : "—"}
          </p>
          <p className="mt-1 text-sm text-slate-500">Qoldiq tugash muddati</p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-3">
            <h2 className="text-sm font-semibold text-slate-900">Omborlar</h2>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Ombor</th>
                <th className="px-4 py-2.5">Mavjud</th>
                <th className="px-4 py-2.5">Band</th>
                <th className="px-4 py-2.5">Tayyor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stocks.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-2.5 text-slate-700">
                    {s.warehouse.name}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">{s.quantity}</td>
                  <td className="px-4 py-2.5 text-slate-600">{s.reserved}</td>
                  <td className="px-4 py-2.5 font-medium text-slate-800">
                    {s.quantity - s.reserved}
                  </td>
                </tr>
              ))}
              {stocks.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                    Hech qaysi omborda qoldiq yo&apos;q.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-3">
            <h2 className="text-sm font-semibold text-slate-900">
              Yetkazib beruvchilar
            </h2>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Nomi</th>
                <th className="px-4 py-2.5">Narx</th>
                <th className="px-4 py-2.5">Muddat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {supplierPrices.map((sp) => (
                <tr key={sp.supplierId}>
                  <td className="px-4 py-2.5 text-slate-700">
                    {sp.supplierName}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">
                    {sp.costPrice ? formatSum(sp.costPrice) : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">
                    {sp.leadTimeDays ? `${sp.leadTimeDays} kun` : "—"}
                  </td>
                </tr>
              ))}
              {supplierPrices.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                    Bog&apos;langan yetkazib beruvchi yo&apos;q.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
            <h2 className="text-sm font-semibold text-slate-900">
              So&apos;nggi narx o&apos;zgarishlari
            </h2>
            <Link
              href={`/admin/products/${id}/stock-history`}
              className="text-xs font-medium text-indigo-600 hover:underline"
            >
              Barchasini ko&apos;rish →
            </Link>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Sana</th>
                <th className="px-4 py-2.5">Eski narx</th>
                <th className="px-4 py-2.5">Yangi narx</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentPriceHistory.map((ph) => (
                <tr key={ph.id}>
                  <td className="px-4 py-2.5 text-slate-500">
                    {new Date(ph.createdAt).toLocaleString("uz-UZ")}
                  </td>
                  <td className="px-4 py-2.5 text-slate-500 line-through">
                    {formatSum(ph.oldPrice)}
                  </td>
                  <td className="px-4 py-2.5 font-medium text-slate-800">
                    {formatSum(ph.newPrice)}
                  </td>
                </tr>
              ))}
              {recentPriceHistory.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                    Hozircha narx tarixi yo&apos;q.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
