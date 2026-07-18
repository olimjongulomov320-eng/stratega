"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { SORT_LABELS, type SortOption } from "@/lib/product-query";

export function CatalogToolbar({
  totalCount,
  currentSort,
}: {
  totalCount: number;
  currentSort: SortOption;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function updateSort(sort: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", sort);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
      <p className="text-sm text-slate-500">
        Topildi: <span className="font-semibold text-slate-700">{totalCount}</span> ta
        mahsulot
      </p>
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-500">Saralash:</span>
        <select
          value={currentSort}
          onChange={(e) => updateSort(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-indigo-400"
        >
          {Object.entries(SORT_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
