"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatSum } from "@/lib/format";
import { StockCell } from "./stock-cell";
import { bulkSetActive } from "./bulk-actions";

type ProductRow = {
  id: string;
  name: string;
  imageUrl: string | null;
  price: number;
  stock: number;
  isActive: boolean;
  category: { name: string };
  daysUntilStockout: number | null;
};

type SortField = "name" | "category" | "price" | "stock" | "daysUntilStockout";

const PAGE_SIZE = 20;

function StockoutBadge({ days }: { days: number | null }) {
  if (days === null) {
    return <span className="text-xs text-slate-400">Ma&apos;lumot yo&apos;q</span>;
  }
  const rounded = Math.ceil(days);
  const tone =
    rounded <= 3
      ? "text-rose-600"
      : rounded <= 7
        ? "text-amber-600"
        : "text-slate-500";
  return (
    <span className={`text-sm font-medium ${tone}`}>{rounded} kun</span>
  );
}

function SortHeader({
  field,
  label,
  sortField,
  sortDir,
  onSort,
}: {
  field: SortField;
  label: string;
  sortField: SortField;
  sortDir: "asc" | "desc";
  onSort: (field: SortField) => void;
}) {
  const active = sortField === field;
  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className={`flex items-center gap-1 text-xs font-semibold uppercase tracking-wide transition-colors duration-150 ${
        active ? "text-indigo-600" : "text-slate-500 hover:text-slate-700"
      }`}
    >
      {label}
      {active && (
        <span className="animate-fade-in-up inline-block">
          {sortDir === "asc" ? "↑" : "↓"}
        </span>
      )}
    </button>
  );
}

export function StockTable({ products }: { products: ProductRow[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [onlyLow, setOnlyLow] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("stock");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();

  const categories = useMemo(
    () =>
      Array.from(
        new Map(products.map((p) => [p.category.name, p.category.name])).values()
      ).sort(),
    [products]
  );

  function resetPage() {
    setPage(1);
  }

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (onlyLow && p.stock > 5) return false;
      if (categoryFilter !== "all" && p.category.name !== categoryFilter) {
        return false;
      }
      if (query && !p.name.toLowerCase().includes(query.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [products, onlyLow, categoryFilter, query]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      let cmp = 0;
      if (sortField === "name") cmp = a.name.localeCompare(b.name);
      else if (sortField === "category") {
        cmp = a.category.name.localeCompare(b.category.name);
      } else if (sortField === "price") cmp = a.price - b.price;
      else if (sortField === "stock") cmp = a.stock - b.stock;
      else if (sortField === "daysUntilStockout") {
        if (a.daysUntilStockout === null && b.daysUntilStockout === null) {
          cmp = 0;
        } else if (a.daysUntilStockout === null) {
          cmp = 1;
        } else if (b.daysUntilStockout === null) {
          cmp = -1;
        } else {
          cmp = a.daysUntilStockout - b.daysUntilStockout;
        }
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [filtered, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = sorted.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  const visibleIds = paginated.map((p) => p.id);
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));

  function toggleSelectAll() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        for (const id of visibleIds) next.delete(id);
      } else {
        for (const id of visibleIds) next.add(id);
      }
      return next;
    });
  }

  function toggleSelectOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleBulkSetActive(isActive: boolean) {
    startTransition(async () => {
      await bulkSetActive(Array.from(selected), isActive);
      setSelected(new Set());
      router.refresh();
    });
  }

  return (
    <div className="mt-6">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            resetPage();
          }}
          placeholder="Mahsulot nomi bo'yicha qidirish..."
          className="w-full max-w-sm rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-indigo-400"
        />
        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            resetPage();
          }}
          className="rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-indigo-400"
        >
          <option value="all">Barcha kategoriyalar</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => {
            setOnlyLow((v) => !v);
            resetPage();
          }}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ${
            onlyLow
              ? "scale-105 bg-indigo-600 text-white shadow-sm"
              : "border border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          Faqat kam qolganlar
        </button>
      </div>

      {selected.size > 0 && (
        <div className="animate-fade-in-up mb-4 flex items-center gap-3 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 shadow-sm">
          <span className="text-sm font-medium text-indigo-700">
            {selected.size} ta tanlandi
          </span>
          <button
            type="button"
            disabled={pending}
            onClick={() => handleBulkSetActive(true)}
            className="rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm transition hover:scale-105 hover:bg-emerald-50 disabled:opacity-50 disabled:hover:scale-100"
          >
            {pending ? "..." : "Faollashtirish"}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => handleBulkSetActive(false)}
            className="rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:scale-105 hover:bg-slate-100 disabled:opacity-50 disabled:hover:scale-100"
          >
            {pending ? "..." : "Nofaollashtirish"}
          </button>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="ml-auto text-xs text-indigo-600 transition hover:underline"
          >
            Bekor qilish
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                />
              </th>
              <th className="px-4 py-3">
                <SortHeader
                  field="name"
                  label="Mahsulot"
                  sortField={sortField}
                  sortDir={sortDir}
                  onSort={toggleSort}
                />
              </th>
              <th className="px-4 py-3">
                <SortHeader
                  field="category"
                  label="Kategoriya"
                  sortField={sortField}
                  sortDir={sortDir}
                  onSort={toggleSort}
                />
              </th>
              <th className="px-4 py-3">
                <SortHeader
                  field="price"
                  label="Narx"
                  sortField={sortField}
                  sortDir={sortDir}
                  onSort={toggleSort}
                />
              </th>
              <th className="px-4 py-3">
                <SortHeader
                  field="stock"
                  label="Ombor"
                  sortField={sortField}
                  sortDir={sortDir}
                  onSort={toggleSort}
                />
              </th>
              <th className="px-4 py-3">
                <SortHeader
                  field="daysUntilStockout"
                  label="Kunlar"
                  sortField={sortField}
                  sortDir={sortDir}
                  onSort={toggleSort}
                />
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Holat
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody
            key={`${currentPage}-${categoryFilter}-${onlyLow}-${query}-${sortField}-${sortDir}`}
            className="stock-table-rows divide-y divide-slate-100"
          >
            {paginated.map((product) => (
              <tr
                key={product.id}
                className={`transition-all duration-200 hover:bg-slate-50 ${
                  selected.has(product.id) ? "bg-indigo-50/60" : ""
                }`}
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(product.id)}
                    onChange={() => toggleSelectOne(product.id)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 transition-transform duration-150 checked:scale-110"
                  />
                </td>
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
                <td className="px-4 py-3">
                  <StockCell productId={product.id} stock={product.stock} />
                </td>
                <td className="px-4 py-3">
                  <StockoutBadge days={product.daysUntilStockout} />
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium transition-colors ${
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
                      href={`/admin/products/${product.id}/stock-history`}
                      className="rounded-lg px-3 py-1.5 text-sm font-medium text-indigo-600 transition-colors hover:bg-indigo-50"
                    >
                      Tarix
                    </Link>
                    <Link
                      href={`/admin/products/${product.id}`}
                      className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
                    >
                      Tahrirlash
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
            {paginated.length === 0 && products.length > 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                  Mos mahsulot topilmadi.
                </td>
              </tr>
            )}
            {products.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                  Hozircha mahsulotlar yo&apos;q.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            {sorted.length} tadan {(currentPage - 1) * PAGE_SIZE + 1}–
            {Math.min(currentPage * PAGE_SIZE, sorted.length)}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-full border border-slate-200 px-3.5 py-1.5 text-sm font-medium text-slate-600 transition-all duration-150 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Oldingi
            </button>
            <span className="text-sm text-slate-500">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-full border border-slate-200 px-3.5 py-1.5 text-sm font-medium text-slate-600 transition-all duration-150 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Keyingi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
