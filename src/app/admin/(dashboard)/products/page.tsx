import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatSum } from "@/lib/format";
import { DeleteProductButton } from "./delete-button";
import { requirePagePermission } from "@/lib/require-permission";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

function toInt(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

export default async function AdminProductsPage(
  props: PageProps<"/admin/products">
) {
  await requirePagePermission("products.read");

  const sp = await props.searchParams;
  const page = toInt(sp.page, 1);
  const query = typeof sp.q === "string" ? sp.q.trim() : "";
  const categoryFilter = typeof sp.category === "string" ? sp.category : "";

  const where = {
    ...(query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" as const } },
            { sku: { contains: query, mode: "insensitive" as const } },
            { barcode: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(categoryFilter ? { categoryId: categoryFilter } : {}),
  };

  const [products, total, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.product.count({ where }),
    prisma.category.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function pageHref(nextPage: number) {
    const params = new URLSearchParams();
    if (nextPage > 1) params.set("page", String(nextPage));
    if (query) params.set("q", query);
    if (categoryFilter) params.set("category", categoryFilter);
    const qs = params.toString();
    return `/admin/products${qs ? `?${qs}` : ""}`;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mahsulotlar</h1>
          <p className="mt-1 text-sm text-slate-500">{total} ta mahsulot</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/api/admin/export?type=products"
            className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            CSV eksport
          </Link>
          <Link
            href="/admin/products/import"
            className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            CSV import
          </Link>
          <Link
            href="/admin/products/new"
            className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            + Yangi mahsulot
          </Link>
        </div>
      </div>

      <form
        method="get"
        className="mt-5 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3"
      >
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="Nom, SKU yoki shtrix-kod bo'yicha qidirish"
          className="w-72 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
        />
        <select
          name="category"
          defaultValue={categoryFilter}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
        >
          <option value="">Barcha kategoriyalar</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Qidirish
        </button>
        {(query || categoryFilter) && (
          <Link
            href="/admin/products"
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50"
          >
            Tozalash
          </Link>
        )}
      </form>

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Mahsulot</th>
              <th className="px-4 py-3">Kategoriya</th>
              <th className="px-4 py-3">Narx</th>
              <th className="px-4 py-3">Ombor</th>
              <th className="px-4 py-3">Faol</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-slate-50">
                <td className="flex items-center gap-3 px-4 py-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-50">
                    {product.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-full w-full object-contain p-1"
                      />
                    ) : (
                      <span className="text-lg">📦</span>
                    )}
                  </div>
                  <span className="font-medium text-slate-800">
                    {product.name}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {product.category.name}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {formatSum(product.price)}
                </td>
                <td className="px-4 py-3 text-slate-600">{product.stock}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      product.isActive
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {product.isActive ? "Faol" : "Nofaol"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/products/${product.id}/overview`}
                      className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
                    >
                      Ko&apos;rish
                    </Link>
                    <Link
                      href={`/admin/products/${product.id}`}
                      className="rounded-lg px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
                    >
                      Tahrirlash
                    </Link>
                    <DeleteProductButton
                      productId={product.id}
                      productName={product.name}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  {query || categoryFilter
                    ? "Qidiruv bo'yicha mahsulot topilmadi."
                    : "Hozircha mahsulotlar yo'q."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <Link
            href={pageHref(page - 1)}
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
            href={pageHref(page + 1)}
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
    </div>
  );
}
