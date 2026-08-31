"use client";

import { useState } from "react";
import Link from "next/link";

export type AttentionItem = {
  productId: string;
  name: string;
  severity: "critical" | "warning" | "info";
  reason: string;
};

const SEVERITY_STYLE: Record<
  AttentionItem["severity"],
  { pill: string; label: string }
> = {
  critical: { pill: "bg-rose-50 text-rose-700", label: "Muhim" },
  warning: { pill: "bg-amber-50 text-amber-700", label: "Ogohlantirish" },
  info: { pill: "bg-slate-100 text-slate-600", label: "Eslatma" },
};

const VISIBLE_COUNT = 8;

export function AttentionPanel({ items }: { items: AttentionItem[] }) {
  const [expanded, setExpanded] = useState(false);

  const visible = expanded ? items : items.slice(0, VISIBLE_COUNT);
  const hasMore = items.length > VISIBLE_COUNT;

  return (
    <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">
          Diqqat talab qiladi
        </h2>
        {items.length > 0 && (
          <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700">
            {items.length}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <p className="mt-3 text-sm text-emerald-700">
          Hozircha muammo yo&apos;q — barcha mahsulotlar yaxshi holatda.
        </p>
      ) : (
        <>
          <ul className="mt-3 divide-y divide-slate-100">
            {visible.map((item) => (
              <li key={item.productId}>
                <Link
                  href={`/admin/products/${item.productId}/stock-history`}
                  className="flex items-center justify-between gap-3 py-2.5 transition hover:bg-slate-50"
                >
                  <span className="min-w-0 truncate text-sm font-medium text-slate-800">
                    {item.name}
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="text-xs text-slate-500">
                      {item.reason}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${SEVERITY_STYLE[item.severity].pill}`}
                    >
                      {SEVERITY_STYLE[item.severity].label}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          {hasMore && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-3 text-sm font-medium text-indigo-600 hover:underline"
            >
              {expanded
                ? "Kamroq ko'rsatish"
                : `Barchasini ko'rish (${items.length})`}
            </button>
          )}
        </>
      )}
    </div>
  );
}
