"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { SearchResult } from "@/app/api/admin/search/route";

type Command = {
  id: string;
  label: string;
  hint?: string;
  href: string;
  group: string;
};

// Cmd+K (macOS) / Ctrl+K (boshqa tizimlar) — tezkor buyruq menyusi.
// Navigatsiya, tezkor amallar va global qidiruv bitta joyda.
const STATIC_COMMANDS: Command[] = [
  { id: "nav:admin", label: "Bosh sahifa", href: "/admin", group: "Navigatsiya" },
  { id: "nav:products", label: "Mahsulotlar", href: "/admin/products", group: "Navigatsiya" },
  { id: "nav:stock", label: "Sklad", href: "/admin/stock", group: "Navigatsiya" },
  { id: "nav:movements", label: "Ombor harakatlari", href: "/admin/stock-movements", group: "Navigatsiya" },
  { id: "nav:documents", label: "Ombor hujjatlari", href: "/admin/stock-documents", group: "Navigatsiya" },
  { id: "nav:orders", label: "Buyurtmalar", href: "/admin/orders", group: "Navigatsiya" },
  { id: "nav:quotations", label: "Takliflar", href: "/admin/quotations", group: "Navigatsiya" },
  { id: "nav:shipments", label: "Jo'natmalar", href: "/admin/shipments", group: "Navigatsiya" },
  { id: "nav:requests", label: "Arizalar (RFQ)", href: "/admin/requests", group: "Navigatsiya" },
  { id: "nav:payments", label: "To'lovlar", href: "/admin/payments", group: "Navigatsiya" },
  { id: "nav:customers", label: "Mijozlar", href: "/admin/customers", group: "Navigatsiya" },
  { id: "nav:suppliers", label: "Yetkazib beruvchilar", href: "/admin/suppliers", group: "Navigatsiya" },
  { id: "nav:analytics", label: "Savdo tahlili", href: "/admin/analytics", group: "Navigatsiya" },
  { id: "nav:alerts", label: "Ogohlantirishlar", href: "/admin/alerts", group: "Navigatsiya" },
  { id: "nav:settings", label: "Sozlamalar", href: "/admin/settings", group: "Navigatsiya" },
  { id: "new:product", label: "Yangi mahsulot qo'shish", href: "/admin/products/new", group: "Tezkor amallar" },
  { id: "new:order", label: "Yangi buyurtma yaratish", href: "/admin/orders/new", group: "Tezkor amallar" },
  { id: "new:document", label: "Yangi ombor hujjati", href: "/admin/stock-documents/new", group: "Tezkor amallar" },
  { id: "new:category", label: "Yangi kategoriya", href: "/admin/categories/new", group: "Tezkor amallar" },
  { id: "new:customer", label: "Yangi mijoz", href: "/admin/customers/new", group: "Tezkor amallar" },
  { id: "new:supplier", label: "Yangi yetkazib beruvchi", href: "/admin/suppliers/new", group: "Tezkor amallar" },
  { id: "import:products", label: "Mahsulotlarni CSV import qilish", href: "/admin/products/import", group: "Tezkor amallar" },
];

const DEBOUNCE_MS = 250;

export function CommandMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openMenu = useCallback(() => {
    setOpen(true);
    setQuery("");
    setActiveIndex(0);
    setResults([]);
  }, []);

  // Global keyboard shortcut.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => {
          if (prev) return false;
          setQuery("");
          setActiveIndex(0);
          setResults([]);
          return true;
        });
      }
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) {
      // Dialog ochilgandan keyin inputga fokus beramiz.
      const t = setTimeout(() => inputRef.current?.focus(), 10);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Debounced global qidiruv (state faqat timeout callback ichida yangilanadi).
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (q.length < 2) {
      debounceRef.current = setTimeout(() => {
        setResults([]);
        setLoading(false);
      }, 0);
      return () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
      };
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setResults(data.results ?? []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const searchCommands: Command[] = useMemo(
    () =>
      results.map((r) => ({
        id: `search:${r.type}:${r.id}`,
        label: r.title,
        hint: r.subtitle,
        href: r.href,
        group: "Qidiruv natijalari",
      })),
    [results]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q
      ? STATIC_COMMANDS.filter(
          (c) =>
            c.label.toLowerCase().includes(q) ||
            c.href.toLowerCase().includes(q)
          // global qidiruv results alohida qo'shiladi
        )
      : STATIC_COMMANDS;
    return [...base, ...searchCommands];
  }, [query, searchCommands]);

  const grouped = useMemo(() => {
    const map = new Map<string, Command[]>();
    for (const cmd of filtered) {
      const arr = map.get(cmd.group) ?? [];
      arr.push(cmd);
      map.set(cmd.group, arr);
    }
    return Array.from(map.entries());
  }, [filtered]);

  // Dummiesiz tekis indekslash (guruhlar bo'ylab).
  const flat = useMemo(() => grouped.flatMap(([, items]) => items), [grouped]);

  // Ro'yxat qisqarganda indeksni render davomida moslashtiramiz (setState-in-effect emas).
  const [prevFlatLength, setPrevFlatLength] = useState(flat.length);
  if (prevFlatLength !== flat.length) {
    setPrevFlatLength(flat.length);
    if (activeIndex >= flat.length) setActiveIndex(0);
  }

  function runCommand(cmd: Command) {
    setOpen(false);
    router.push(cmd.href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (flat.length ? (i + 1) % flat.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (flat.length ? (i - 1 + flat.length) % flat.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const cmd = flat[activeIndex];
      if (cmd) runCommand(cmd);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={openMenu}
        className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-500 hover:border-slate-300 hover:text-slate-700 md:flex"
        title="Buyruq menyusi (Cmd+K)"
      >
        <span>Buyruqlar…</span>
        <kbd className="rounded border border-slate-300 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
          ⌘K
        </kbd>
      </button>
    );
  }

  let runningIndex = -1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/40 px-4 pt-[12vh]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Buyruq menyusi"
      >
        <div className="border-b border-slate-200 px-4">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Buyruq yoki mahsulot, mijoz, buyurtma…"
            className="w-full bg-transparent py-3.5 text-sm text-slate-900 outline-none placeholder:text-slate-400"
          />
        </div>

        <div ref={listRef} className="max-h-[50vh] overflow-y-auto py-2">
          {flat.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-slate-400">
              {loading ? "Qidirilmoqda…" : "Hech narsa topilmadi."}
            </p>
          )}
          {grouped.map(([group, items]) => (
            <div key={group}>
              <p className="px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {group}
              </p>
              {items.map((cmd) => {
                runningIndex += 1;
                const isActive = runningIndex === activeIndex;
                return (
                  <button
                    key={cmd.id}
                    type="button"
                    onClick={() => runCommand(cmd)}
                    onMouseEnter={() => setActiveIndex(flat.indexOf(cmd))}
                    className={`flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm ${
                      isActive
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="truncate font-medium">{cmd.label}</span>
                    {cmd.hint && (
                      <span className="shrink-0 text-xs text-slate-400">
                        {cmd.hint}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-2 text-[11px] text-slate-400">
          <span>↑↓ tanlash · Enter ochish · Esc yopish</span>
          <span>Cmd+K</span>
        </div>
      </div>
    </div>
  );
}
