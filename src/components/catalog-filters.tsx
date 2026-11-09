"use client";
import { usePathname, useRouter } from "next/navigation";
import { useI18n } from "@/i18n/client";
import { firstParam, type CatalogParams } from "@/lib/query-params";

export function CatalogFilters({ brands, params: current }: { brands: string[]; params: CatalogParams }) {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  function update(key: string, value: string) {
    const params = new URLSearchParams(window.location.search);
    if (value) params.set(key, value); else params.delete(key);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }
  return <div className="flex flex-col gap-4 border-t border-slate-200 pt-5">
    {brands.length > 0 && <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">{t.product.brand}
      <select value={firstParam(current.brand) ?? ""} onChange={(e) => update("brand", e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal">
        <option value="">{t.catalog.allBrands}</option>{brands.map((brand) => <option key={brand} value={brand}>{brand}</option>)}
      </select>
    </label>}
    <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={firstParam(current.inStock) === "1"} onChange={(e) => update("inStock", e.target.checked ? "1" : "")} className="accent-indigo-600" />{t.catalog.inStockOnly}</label>
  </div>;
}
