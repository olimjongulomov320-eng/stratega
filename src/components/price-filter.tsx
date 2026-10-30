"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/i18n/client";

export function PriceFilter({
  minParam = "minPrice",
  maxParam = "maxPrice",
  label,
  placeholderMin,
  placeholderMax,
}: {
  minParam?: string;
  maxParam?: string;
  /** Heading; defaults to "Price". Used for the spec filters too (capacity, lift height, width, power). */
  label?: string;
  placeholderMin?: string;
  placeholderMax?: string;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [min, setMin] = useState(searchParams.get(minParam) ?? "");
  const [max, setMax] = useState(searchParams.get(maxParam) ?? "");

  function apply(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    if (min) params.set(minParam, min);
    else params.delete(minParam);
    if (max) params.set(maxParam, max);
    else params.delete(maxParam);
    router.push(`${pathname}?${params.toString()}`);
  }

  function clear() {
    setMin("");
    setMax("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete(minParam);
    params.delete(maxParam);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <form onSubmit={apply} className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-slate-700">{label ?? t.catalog.price}</h2>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={0}
          step="any"
          value={min}
          onChange={(e) => setMin(e.target.value)}
          placeholder={placeholderMin ?? t.catalog.from}
          aria-label={t.catalog.from}
          className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-indigo-400"
        />
        <span className="text-slate-400">—</span>
        <input
          type="number"
          min={0}
          step="any"
          value={max}
          onChange={(e) => setMax(e.target.value)}
          placeholder={placeholderMax ?? t.catalog.to}
          aria-label={t.catalog.to}
          className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-indigo-400"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 rounded-lg bg-indigo-600 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          {t.common.apply}
        </button>
        {(searchParams.get(minParam) || searchParams.get(maxParam)) && (
          <button
            type="button"
            onClick={clear}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
          >
            {t.common.clear}
          </button>
        )}
      </div>
    </form>
  );
}
