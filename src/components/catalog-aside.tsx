"use client";

import { useState } from "react";

/** Catalogue sidebar: always visible from md up; on phones it is folded behind one button so products come first. */
export function CatalogAside({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <aside className="flex flex-col gap-6">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 md:hidden"
      >
        <span>☰ {label}</span>
        <span aria-hidden="true">{open ? "▲" : "▼"}</span>
      </button>
      <div className={`${open ? "flex" : "hidden"} flex-col gap-6 md:flex`}>{children}</div>
    </aside>
  );
}
