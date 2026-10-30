"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { SortOption } from "@/lib/products";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n";

export function CatalogToolbar({ totalCount, currentSort }: { totalCount: number; currentSort: SortOption }) {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const labels: Record<SortOption, string> = {
    popular: t.catalog.sortPopular,
    newest: t.catalog.sortNewest,
    price_asc: t.catalog.sortPriceAsc,
    price_desc: t.catalog.sortPriceDesc,
  };

  function updateSort(sort: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    if (sort === "popular") params.delete("sort");
    else params.set("sort", sort);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
      <p className="text-sm text-slate-500">{fmt(t.catalog.found, { n: totalCount })}</p>
      <label className="flex items-center gap-2 text-sm text-slate-500">
        {t.catalog.sort}:
        <select
          value={currentSort}
          onChange={(e) => updateSort(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 outline-none focus:border-indigo-400"
        >
          {(Object.keys(labels) as SortOption[]).map((value) => (
            <option key={value} value={value}>
              {labels[value]}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
