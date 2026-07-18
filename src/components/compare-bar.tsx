"use client";

import Link from "next/link";
import { useCompare, MAX_COMPARE } from "@/lib/compare-context";

export function CompareBar() {
  const { items, remove, clear, count } = useCompare();

  if (count === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
        <span className="text-sm font-semibold text-slate-700">
          Solishtirish ({count}/{MAX_COMPARE})
        </span>
        <div className="flex flex-1 flex-wrap gap-2">
          {items.map((item) => (
            <span
              key={item.id}
              className="flex items-center gap-1.5 rounded-full bg-slate-100 py-1 pl-3 pr-1 text-xs text-slate-600"
            >
              <span className="max-w-[10rem] truncate">{item.name}</span>
              <button
                onClick={() => remove(item.id)}
                aria-label="Olib tashlash"
                className="flex h-4 w-4 items-center justify-center rounded-full hover:bg-slate-200"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
        <button
          onClick={clear}
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          Tozalash
        </button>
        <Link
          href="/compare"
          className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Solishtirish →
        </Link>
      </div>
    </div>
  );
}
