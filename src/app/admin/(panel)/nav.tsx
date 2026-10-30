"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export type NavGroup = { title: string; items: { href: string; label: string }[] };

export function AdminNav({ groups }: { groups: NavGroup[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`));

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="admin-navigation"
        aria-label={open ? "Menyuni yopish" : "Menyuni ochish"}
        className="print:hidden fixed left-3 top-3 z-50 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white lg:hidden"
      >
        {open ? "× Yopish" : "☰ Menyu"}
      </button>
      {open && (
        <button
          type="button"
          aria-label="Menyuni yopish"
          onClick={() => setOpen(false)}
          className="print:hidden fixed inset-0 z-30 bg-slate-950/50 backdrop-blur-[1px] lg:hidden"
        />
      )}
      <nav
        id="admin-navigation"
        aria-label="Admin navigatsiyasi"
        className={`print:hidden fixed inset-y-0 left-0 z-40 w-72 max-w-[calc(100vw-2rem)] overflow-y-auto bg-slate-950 px-3 pb-8 pt-16 text-slate-300 shadow-2xl transition-transform lg:w-64 lg:max-w-none lg:translate-x-0 lg:pt-6 lg:shadow-none ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Link href="/admin" className="mb-6 block px-3 text-lg font-black text-white">
          STRATEG<span className="text-indigo-500">A</span> <span className="text-xs font-medium text-slate-500">admin</span>
        </Link>
        {groups.map((g) => (
          <div key={g.title} className="mb-5">
            <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{g.title}</p>
            {g.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={`block rounded-lg px-3 py-2 text-sm transition ${
                  isActive(item.href) ? "bg-indigo-600 font-semibold text-white" : "hover:bg-white/5 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        ))}
      </nav>
    </>
  );
}
