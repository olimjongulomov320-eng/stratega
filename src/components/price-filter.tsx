"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState } from "react";

export function PriceFilter({
  minParam = "minPrice",
  maxParam = "maxPrice",
}: {
  minParam?: string;
  maxParam?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [min, setMin] = useState(searchParams.get(minParam) ?? "");
  const [max, setMax] = useState(searchParams.get(maxParam) ?? "");

  function apply(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
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
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <form onSubmit={apply} className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-slate-700">Narx, so&apos;m</h3>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={0}
          value={min}
          onChange={(e) => setMin(e.target.value)}
          placeholder="dan"
          className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-indigo-400"
        />
        <span className="text-slate-400">—</span>
        <input
          type="number"
          min={0}
          value={max}
          onChange={(e) => setMax(e.target.value)}
          placeholder="gacha"
          className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-indigo-400"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 rounded-lg bg-indigo-600 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Qo&apos;llash
        </button>
        {(searchParams.get(minParam) || searchParams.get(maxParam)) && (
          <button
            type="button"
            onClick={clear}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
          >
            Tozalash
          </button>
        )}
      </div>
    </form>
  );
}
