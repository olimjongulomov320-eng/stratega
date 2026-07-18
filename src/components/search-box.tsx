"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { formatSum } from "@/lib/format";

type Suggestion = {
  products: { id: string; slug: string; name: string; price: number; imageUrl: string | null }[];
  categories: { slug: string; name: string; icon: string | null }[];
};

export function SearchBox({ mobile = false }: { mobile?: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion | null>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query.trim();
    const controller = new AbortController();
    const timer = setTimeout(() => {
      if (q.length < 2) {
        setSuggestions(null);
        return;
      }
      fetch(`/api/search-suggestions?q=${encodeURIComponent(q)}`, {
        signal: controller.signal,
      })
        .then((res) => res.json())
        .then((data) => setSuggestions(data))
        .catch(() => {});
    }, 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const flatResults = suggestions
    ? [...suggestions.categories.map((c) => ({ type: "category" as const, ...c })), ...suggestions.products.map((p) => ({ type: "product" as const, ...p }))]
    : [];

  function goToSearch(q: string) {
    setOpen(false);
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    goToSearch(query.trim());
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || flatResults.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, flatResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      const result = flatResults[activeIndex];
      if (result.type === "category") router.push(`/category/${result.slug}`);
      else router.push(`/product/${result.slug}`);
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={handleSubmit} className="w-full">
        <div className="flex w-full items-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 transition focus-within:border-indigo-400 focus-within:bg-white">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 shrink-0 text-slate-400">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              setActiveIndex(-1);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            type="text"
            placeholder={mobile ? "Qidirish..." : "Mahsulot, brend yoki kategoriya qidirish..."}
            className="w-full bg-transparent px-3 text-sm outline-none placeholder:text-slate-400"
          />
        </div>
      </form>

      {open && query.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-96 overflow-y-auto rounded-xl border border-slate-100 bg-white py-2 shadow-xl">
          {!suggestions ? (
            <p className="px-4 py-3 text-sm text-slate-400">Qidirilmoqda...</p>
          ) : flatResults.length === 0 ? (
            <p className="px-4 py-3 text-sm text-slate-400">Hech narsa topilmadi</p>
          ) : (
            <>
              {suggestions.categories.length > 0 && (
                <div className="px-2 pb-1">
                  <p className="px-2 py-1 text-xs font-semibold uppercase text-slate-400">
                    Kategoriyalar
                  </p>
                  {suggestions.categories.map((cat, i) => (
                    <Link
                      key={cat.slug}
                      href={`/category/${cat.slug}`}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-2 rounded-lg px-2 py-2 text-sm ${
                        activeIndex === i ? "bg-indigo-50 text-indigo-600" : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span>{cat.icon}</span>
                      {cat.name}
                    </Link>
                  ))}
                </div>
              )}
              {suggestions.products.length > 0 && (
                <div className="px-2 pt-1">
                  <p className="px-2 py-1 text-xs font-semibold uppercase text-slate-400">
                    Mahsulotlar
                  </p>
                  {suggestions.products.map((p, i) => {
                    const idx = suggestions.categories.length + i;
                    return (
                      <Link
                        key={p.id}
                        href={`/product/${p.slug}`}
                        onClick={() => setOpen(false)}
                        className={`flex items-center gap-3 rounded-lg px-2 py-2 text-sm ${
                          activeIndex === idx ? "bg-indigo-50" : "hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-50 p-0.5">
                          {p.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.imageUrl} alt={p.name} className="h-full w-full object-contain" />
                          ) : (
                            <span className="text-lg">📦</span>
                          )}
                        </div>
                        <span className="flex-1 truncate text-slate-700">{p.name}</span>
                        <span className="shrink-0 font-semibold text-slate-900">
                          {formatSum(p.price)}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
              <button
                onClick={() => goToSearch(query.trim())}
                className="mt-1 w-full border-t border-slate-100 px-4 py-2.5 text-left text-sm font-medium text-indigo-600 hover:bg-indigo-50"
              >
                &quot;{query.trim()}&quot; bo&apos;yicha barcha natijalarni ko&apos;rish →
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
