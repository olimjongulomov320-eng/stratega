"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import { useWishlist } from "@/lib/wishlist-context";
import { SearchBox } from "@/components/search-box";

export type HeaderCategory = {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
  productCount: number;
};

export function Header({ categories }: { categories: HeaderCategory[] }) {
  const { totalItems } = useCart();
  const { count: wishlistCount } = useWishlist();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm">
      {/* Top bar */}
      <div className="border-b border-slate-100">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-lg font-black text-white">
              S
            </span>
            <span className="text-xl font-black tracking-tight text-slate-900">
              Strateg<span className="text-indigo-600">a</span>
            </span>
          </Link>

          <div className="hidden flex-1 sm:block">
            <SearchBox />
          </div>

          <Link
            href="/wishlist"
            className="relative hidden shrink-0 items-center gap-2 rounded-full border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-rose-200 hover:text-rose-500 sm:flex"
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
            href="/cart"
            className="relative flex shrink-0 items-center gap-2 rounded-full bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
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
            <span className="hidden sm:inline">Savat</span>
            {totalItems > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-xs font-bold text-white">
                {totalItems}
              </span>
            )}
          </Link>
        </div>

        {/* Mobile search */}
        <div className="px-4 pb-3 sm:hidden">
          <SearchBox mobile />
        </div>
      </div>

      {/* Category bar */}
      <div className="hidden border-b border-slate-100 bg-slate-50 sm:block">
        <div className="mx-auto flex max-w-7xl items-center gap-1 px-4 sm:px-6">
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              onBlur={() => setTimeout(() => setMenuOpen(false), 150)}
              className="flex items-center gap-2 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:text-indigo-600"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="h-4 w-4"
              >
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
              Barcha kategoriyalar
            </button>
            {menuOpen && (
              <div className="absolute left-0 top-full z-50 w-64 rounded-xl border border-slate-100 bg-white py-2 shadow-lg">
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

          <nav className="flex items-center gap-1 overflow-x-auto">
            {categories.slice(0, 6).map((cat) => (
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
