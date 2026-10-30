"use client";

import Link from "next/link";
import { useCompare, MAX_COMPARE } from "@/lib/compare-context";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n";

export function CompareBar() {
  const { items, remove, clear, count } = useCompare();
  const { t, href } = useI18n();

  if (count === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
        <span className="text-sm font-semibold text-slate-700">
          {fmt(t.compare.bar, { n: count, max: MAX_COMPARE })}
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
                aria-label={t.common.remove}
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
          {t.common.clear}
        </button>
        <Link
          href={href("/compare")}
          className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          {t.compare.go}
        </Link>
      </div>
    </div>
  );
}
