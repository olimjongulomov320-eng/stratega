"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { SearchResult } from "@/app/api/admin/search/route";

const TYPE_LABELS: Record<SearchResult["type"], string> = {
  product: "Mahsulot",
  customer: "Mijoz",
  supplier: "Yetkazib beruvchi",
  order: "Buyurtma",
  request: "Ariza",
};

const DEBOUNCE_MS = 250;

export function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/admin/search?q=${encodeURIComponent(query.trim())}`
        );
        const data = await res.json();
        setResults(data.results ?? []);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(result: SearchResult) {
    setOpen(false);
    setQuery("");
    router.push(result.href);
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-xs">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Qidirish... (mahsulot, mijoz, buyurtma)"
        className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm outline-none focus:border-indigo-400"
      />

      {open && query.trim().length >= 2 && (
        <div className="animate-fade-in-up absolute left-0 right-0 top-full z-20 mt-1.5 max-h-80 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
          {loading && (
            <p className="px-4 py-3 text-sm text-slate-400">Qidirilmoqda...</p>
          )}
          {!loading && results.length === 0 && (
            <p className="px-4 py-3 text-sm text-slate-400">
              Hech narsa topilmadi.
            </p>
          )}
          {!loading &&
            results.map((r) => (
              <button
                key={`${r.type}-${r.id}`}
                type="button"
                onClick={() => handleSelect(r)}
                className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-slate-50"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-800">
                    {r.title}
                  </p>
                  <p className="truncate text-xs text-slate-400">
                    {r.subtitle}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                  {TYPE_LABELS[r.type]}
                </span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
