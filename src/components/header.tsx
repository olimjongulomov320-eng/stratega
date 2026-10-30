"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRfq } from "@/lib/rfq-context";
import { useWishlist } from "@/lib/wishlist-context";
import { SearchBox } from "@/components/search-box";
import { LogoMark } from "@/components/logo-mark";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useI18n } from "@/i18n/client";
import { COMPANY } from "@/lib/site";
import type { HeaderCategory, MenuDirection } from "@/lib/categories";

export type HeaderUser = { phone: string; companyName: string | null } | null;

export function Header({
  categories,
  directions = [],
  user,
  hasSpareParts = false,
}: {
  categories: HeaderCategory[];
  directions?: MenuDirection[];
  user: HeaderUser;
  hasSpareParts?: boolean;
}) {
  const { t, href } = useI18n();
  const { totalItems } = useRfq();
  const { count: wishlistCount } = useWishlist();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40">
      <div className="hidden bg-slate-950 text-slate-300 sm:block">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-2 text-xs sm:px-6">
          <span className="rounded bg-indigo-600 px-2 py-0.5 font-bold text-white">{t.common.b2bBadge}</span>
          <span>{t.common.b2bPlatform}</span>
          <span className="hidden text-slate-600 md:inline">|</span>
          <span className="hidden md:inline">{t.common.acrossUzbekistan}</span>
          <div className="ml-auto flex items-center gap-4">
            <Link href={href("/yuridik-shaxslar")} className="hidden hover:text-white lg:inline">
              {t.focus.b2bNav}
            </Link>
            <Link href={href("/payment")} className="hidden hover:text-white lg:inline">
              {t.common.documentsVat}
            </Link>
            <Link href={href("/faq")} className="hidden hover:text-white lg:inline">
              {t.common.help}
            </Link>
            <span className="hidden text-slate-600 lg:inline">|</span>
            <a href={`tel:${COMPANY.phoneHref}`} className="whitespace-nowrap font-semibold text-white">
              {COMPANY.phone}
            </a>
          </div>
        </div>
      </div>

      <div className="border-b border-slate-100 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link href={href("/")} className="flex shrink-0 items-center gap-2" aria-label="Stratega">
            <LogoMark className="h-9 w-9" />
            <span className="text-xl font-black tracking-tight text-slate-900">
              STRATEG<span className="text-indigo-600">A</span>
            </span>
          </Link>

          <div className="relative hidden shrink-0 sm:block">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              onBlur={() => setTimeout(() => setMenuOpen(false), 150)}
              aria-expanded={menuOpen}
              className="flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
              {t.common.catalog}
            </button>
            {menuOpen && (
              <div className="absolute left-0 top-full z-50 mt-2 w-72 rounded-xl border border-slate-100 bg-white py-2 shadow-lg">
                {directions.map((d) => (
                  <Link
                    key={d.slug}
                    href={href(`/yonalish/${d.slug}`)}
                    className="flex items-center justify-between px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-indigo-50 hover:text-indigo-600"
                  >
                    <span className="flex items-center gap-2">
                      <span>{d.icon}</span>
                      {d.name}
                    </span>
                    <span className="text-xs font-normal text-slate-400">{d.productCount}</span>
                  </Link>
                ))}
                {directions.length > 0 && <div className="my-1 border-t border-slate-100" />}
                {categories.filter((cat) => !directions.some((d) => d.categorySlugs.includes(cat.slug))).map((cat) => (
                  <Link
                    key={cat.id}
                    href={href(`/category/${cat.slug}`)}
                    className="flex items-center justify-between px-4 py-2.5 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-600"
                  >
                    <span className="flex items-center gap-2">
                      <span>{cat.icon}</span>
                      {cat.name}
                    </span>
                    <span className="text-xs text-slate-400">{cat.productCount}</span>
                  </Link>
                ))}
                {hasSpareParts && (
                  <Link
                    href={href("/ehtiyot-qismlar")}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-600"
                  >
                    <span>🔧</span>
                    {t.common.spareParts}
                  </Link>
                )}
                <Link
                  href={href("/search")}
                  className="mt-1 block border-t border-slate-100 px-4 pt-2.5 text-sm font-medium text-indigo-600"
                >
                  {t.catalog.allProducts} →
                </Link>
              </div>
            )}
          </div>

          <div className="hidden flex-1 md:block">
            <SearchBox />
          </div>

          <div className="ml-auto flex items-center gap-2 sm:ml-0">
            <Suspense fallback={null}>
              <LanguageSwitcher compact />
            </Suspense>

            <Link
              href={href("/wishlist")}
              aria-label={t.common.wishlist}
              className="relative hidden h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-rose-200 hover:text-rose-500 xl:flex"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
                <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
              </svg>
              {wishlistCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-xs font-bold text-white">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <Link
              href={href(user ? "/kabinet" : "/kirish")}
              className="hidden shrink-0 items-center gap-2 rounded-full border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600 md:flex"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
              </svg>
              <span className="max-w-[10rem] truncate">{user ? user.companyName ?? user.phone : t.common.cabinet}</span>
            </Link>

            <Link
              href={href("/korzina")}
              className="relative hidden shrink-0 items-center gap-2 rounded-full bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 sm:flex"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              {t.common.cart}
              {totalItems > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-xs font-bold text-white">
                  {totalItems}
                </span>
              )}
            </Link>

            <a
              href={`tel:${COMPANY.phoneHref}`}
              aria-label={t.common.call}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white transition hover:bg-indigo-700 sm:hidden"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4.5 w-4.5">
                <path
                  d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.7a2 2 0 0 1-.4 2.1L8 9.9a16 16 0 0 0 6 6l1.4-1.4a2 2 0 0 1 2.1-.4c.9.3 1.8.5 2.7.6a2 2 0 0 1 1.8 2.2z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </div>
        </div>

        <div className="px-4 pb-3 md:hidden">
          <SearchBox mobile />
        </div>
      </div>

      <div className="hidden border-b border-slate-100 bg-slate-50 sm:block">
        <nav className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 sm:px-6">
          {(directions.length > 0 ? directions.map((d) => ({ key: d.slug, path: `/yonalish/${d.slug}`, name: d.name })) : categories.map((c) => ({ key: c.id, path: `/category/${c.slug}`, name: c.name }))).map((item) => (
            <Link
              key={item.key}
              href={href(item.path)}
              className="whitespace-nowrap px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-indigo-600"
            >
              {item.name}
            </Link>
          ))}
          {hasSpareParts && (
            <Link
              href={href("/ehtiyot-qismlar")}
              className="whitespace-nowrap px-3 py-2.5 text-sm font-semibold text-slate-700 hover:text-indigo-600"
            >
              {t.common.spareParts}
            </Link>
          )}
          <Link
            href={href("/compare")}
            className="whitespace-nowrap px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-indigo-600"
          >
            {t.common.compare}
          </Link>
        </nav>
      </div>
    </header>
  );
}
