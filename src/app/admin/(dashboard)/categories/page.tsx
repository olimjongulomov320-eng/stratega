import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DeleteCategoryButton } from "./delete-button";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: true } } },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Kategoriyalar</h1>
        <Link
          href="/admin/categories/new"
          className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          + Yangi kategoriya
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Kategoriya</th>
              <th className="px-4 py-3">Tartib</th>
              <th className="px-4 py-3">Mahsulotlar</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {categories.map((cat) => (
              <tr key={cat.id} className="hover:bg-slate-50">
                <td className="flex items-center gap-2 px-4 py-3 font-medium text-slate-800">
                  <span>{cat.icon}</span>
                  {cat.name}
                </td>
                <td className="px-4 py-3 text-slate-600">{cat.sortOrder}</td>
                <td className="px-4 py-3 text-slate-600">
                  {cat._count.products}
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
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                  Hozircha kategoriyalar yo&apos;q.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
