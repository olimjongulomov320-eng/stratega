"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { LOCALES, LOCALE_LABELS, localePath, stripLocale } from "@/i18n/config";
import { useI18n } from "@/i18n/client";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, t } = useI18n();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const base = stripLocale(pathname);
  const qs = searchParams.toString();

  return (
    <div
      className="relative"
      onBlur={(e) => {
        // Close only when focus leaves the whole widget, so keyboard users can Tab into the list.
        if (!e.currentTarget.contains(e.relatedTarget)) setTimeout(() => setOpen(false), 150);
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          setOpen(false);
          e.currentTarget.querySelector("button")?.focus();
        }
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t.common.language}
        aria-expanded={open}
        className={`flex items-center gap-1.5 rounded-full border border-slate-200 font-medium text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600 ${
          compact ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-sm"
        }`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        {compact ? locale.toUpperCase() : LOCALE_LABELS[locale]}
      </button>
      {open && (
        <div onClick={() => setOpen(false)} className="absolute right-0 top-full z-50 mt-2 w-40 rounded-xl border border-slate-100 bg-white py-1.5 shadow-lg">
          {LOCALES.map((l) => (
            <Link
              key={l}
              href={`${localePath(l, base)}${qs ? `?${qs}` : ""}`}
              hrefLang={l}
              className={`block px-4 py-2 text-sm hover:bg-indigo-50 ${
                l === locale ? "font-semibold text-indigo-600" : "text-slate-700"
              }`}
            >
              {LOCALE_LABELS[l]}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
