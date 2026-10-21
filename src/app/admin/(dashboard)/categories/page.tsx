import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DeleteCategoryButton } from "./delete-button";
import { requirePagePermission } from "@/lib/require-permission";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage(
  props: PageProps<"/admin/categories">
) {
  await requirePagePermission("products.read");

  const sp = await props.searchParams;
  const query = typeof sp.q === "string" ? sp.q.trim() : "";

  const where = query
    ? {
        OR: [
          { name: { contains: query, mode: "insensitive" as const } },
          { slug: { contains: query, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [categories, total, allCount, productTotal] = await Promise.all([
    prisma.category.findMany({
      where,
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { products: true } } },
    }),
    prisma.category.count({ where }),
    prisma.category.count(),
    prisma.product.count(),
  ]);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kategoriyalar</h1>
          <p className="mt-1 text-sm text-slate-500">
            {total} ta kategoriya · {productTotal} ta mahsulot taqsimlangan
          </p>
        </div>
        <Link
          href="/admin/categories/new"
          className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          + Yangi kategoriya
        </Link>
      </div>

      <form
        method="get"
        className="mt-5 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3"
      >
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="Nom yoki slug bo'yicha qidirish"
          className="w-72 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
        />
        <button
          type="submit"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Qidirish
        </button>
        {query && (
          <Link
            href="/admin/categories"
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
              <th className="px-4 py-3">Kategoriya</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Tartib</th>
              <th className="px-4 py-3">Mahsulotlar</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {categories.map((cat) => (
              <tr key={cat.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 font-medium text-slate-800">
                    <span>{cat.icon}</span>
                    {cat.name}
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-400">
                  {cat.slug}
                </td>
                <td className="px-4 py-3 text-slate-600">{cat.sortOrder}</td>
                <td className="px-4 py-3">
                  {cat._count.products > 0 ? (
                    <Link
                      href={`/admin/products?category=${cat.id}`}
                      className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 hover:bg-indigo-50 hover:text-indigo-600"
                      title="Mahsulotlarni ko'rish"
                    >
                      {cat._count.products} ta →
                    </Link>
                  ) : (
                    <span className="text-xs text-slate-400">0 ta</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/categories/${cat.id}`}
                      className="rounded-lg px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
                    >
                      Tahrirlash
                    </Link>
                    <DeleteCategoryButton
                      categoryId={cat.id}
                      categoryName={cat.name}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  {query
                    ? "Qidiruv bo'yicha kategoriya topilmadi."
                    : "Hozircha kategoriyalar yo'q."}
                  {query && allCount > 0 && (
                    <>
                      {" "}
                      <Link
                        href="/admin/categories"
                        className="font-medium text-indigo-600 hover:underline"
                      >
                        Barchasini ko&apos;rsatish
                      </Link>
                    </>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
