"use client";

import Link from "next/link";
import { useState } from "react";
import { useRfq } from "@/lib/rfq-context";
import { useWishlist } from "@/lib/wishlist-context";
import { SearchBox } from "@/components/search-box";

export type HeaderCategory = {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
  productCount: number;
};

export type HeaderUser = {
  phone: string;
  companyName: string | null;
} | null;

export function Header({
  categories,
  user,
}: {
  categories: HeaderCategory[];
  user: HeaderUser;
}) {
  const { totalItems } = useRfq();
  const { count: wishlistCount } = useWishlist();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40">
      {/* Top utility bar */}
      <div className="hidden bg-slate-950 text-slate-300 sm:block">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-2 text-xs sm:px-6">
          <span className="flex items-center gap-1.5 rounded bg-indigo-600 px-2 py-0.5 font-bold text-white">
            B2B
          </span>
          <span className="hidden sm:inline">Biznes uchun platforma</span>
          <span className="hidden text-slate-600 md:inline">|</span>
          <span className="hidden md:inline">
            Toshkent va O&apos;zbekiston bo&apos;ylab
          </span>
          <div className="ml-auto flex items-center gap-4">
            <Link href="/payment" className="hidden hover:text-white sm:inline">
              Hujjatlar va NDS
            </Link>
            <Link href="/faq" className="hidden hover:text-white sm:inline">
              Yordam
            </Link>
            <span className="hidden text-slate-600 sm:inline">|</span>
            <a href="tel:+998785555535" className="font-semibold text-white">
              +998 78 555-55-35
            </a>
          </div>
        </div>
      </div>

      {/* Main bar */}
      <div className="border-b border-slate-100 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-lg font-black text-white">
              S
            </span>
            <span className="text-xl font-black tracking-tight text-slate-900">
              Strateg<span className="text-indigo-600">a</span>
            </span>
          </Link>

          <div className="relative hidden shrink-0 sm:block">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              onBlur={() => setTimeout(() => setMenuOpen(false), 150)}
              className="flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
              Katalog
            </button>
            {menuOpen && (
              <div className="absolute left-0 top-full z-50 mt-2 w-64 rounded-xl border border-slate-100 bg-white py-2 shadow-lg">
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/category/${cat.slug}`}
                    className="flex items-center justify-between px-4 py-2.5 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-600"
                  >
                    <span className="flex items-center gap-2">
                      <span>{cat.icon}</span>
                      {cat.name}
                    </span>
                    <span className="text-xs text-slate-400">
                      {cat.productCount}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="hidden flex-1 sm:block">
            <SearchBox />
          </div>

          <Link
            href="/wishlist"
            className="relative hidden shrink-0 items-center gap-2 rounded-full border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-rose-200 hover:text-rose-500 xl:flex"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
              <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
            </svg>
            {wishlistCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-xs font-bold text-white">
                {wishlistCount}
              </span>
            )}
          </Link>

          <Link
            href={user ? "/kabinet" : "/kirish"}
            className="hidden shrink-0 items-center gap-2 rounded-full border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600 md:flex"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
            </svg>
            {user ? user.companyName ?? user.phone : "Shaxsiy kabinet"}
          </Link>

          <Link
            href="/kabinet"
            className="relative hidden shrink-0 items-center gap-2 rounded-full border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600 lg:flex"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />
            </svg>
            Mening arizalarim
          </Link>

          <Link
            href="/korzina"
            className="relative hidden shrink-0 items-center gap-2 rounded-full bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 sm:flex"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="h-5 w-5"
            >
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            <span className="hidden sm:inline">Korzina</span>
            {totalItems > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-xs font-bold text-white">
                {totalItems}
              </span>
            )}
          </Link>

          <a
            href="tel:+998785555535"
            aria-label="Qo'ng'iroq qilish"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white transition hover:bg-indigo-700 sm:hidden"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4.5 w-4.5">
              <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.7a2 2 0 0 1-.4 2.1L8 9.9a16 16 0 0 0 6 6l1.4-1.4a2 2 0 0 1 2.1-.4c.9.3 1.8.5 2.7.6a2 2 0 0 1 1.8 2.2z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>

        {/* Mobile search */}
        <div className="px-4 pb-3 sm:hidden">
          <SearchBox mobile />
        </div>
      </div>

      {/* Category bar */}
      <div className="hidden border-b border-slate-100 bg-slate-50 sm:block">
        <div className="mx-auto flex max-w-7xl items-center gap-1 px-4 sm:px-6">
          <nav className="flex items-center gap-1 overflow-x-auto">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                className="whitespace-nowrap px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-indigo-600"
              >
                {cat.name}
              </Link>
            ))}
            <Link
              href="/compare"
              className="whitespace-nowrap px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-indigo-600"
            >
              Solishtirish
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
