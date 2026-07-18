"use client";

import Link from "next/link";
import { useState } from "react";
import { useRfq } from "@/lib/rfq-context";
import { useWishlist } from "@/lib/wishlist-context";
import { useCompare } from "@/lib/compare-context";
import { useQuickView } from "@/lib/quick-view-context";
import { formatSum } from "@/lib/format";
import { StarRating } from "@/components/star-rating";

export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  price: number;
  oldPrice: number | null;
  imageUrl: string | null;
  stock: number;
  rating: number;
  reviewCount: number;
  soldCount: number;
};

export function ProductCard({ product }: { product: ProductCardData }) {
  const { addItem } = useRfq();
  const { isWishlisted, toggle: toggleWishlist } = useWishlist();
  const { isComparing, toggle: toggleCompare, maxReached } = useCompare();
  const { open: openQuickView } = useQuickView();
  const [added, setAdded] = useState(false);

  function handleAdd() {
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  function handleCompareToggle() {
    const ok = toggleCompare({
      id: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
    });
    if (!ok) {
      // Silently ignore; the compare bar already shows the limit.
    }
  }

  const outOfStock = product.stock <= 0;
  const discountPercent = product.oldPrice
    ? Math.round(100 - (product.price / product.oldPrice) * 100)
    : null;
  const comparing = isComparing(product.id);

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-100">
      <div className="relative">
        <Link href={`/product/${product.slug}`} className="relative block">
          {discountPercent !== null && (
            <span className="absolute left-3 top-3 z-10 rounded-md bg-rose-500 px-2 py-0.5 text-xs font-bold text-white">
              -{discountPercent}%
            </span>
          )}
          <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-slate-50 p-6">
            <div className="pointer-events-none absolute inset-0 scale-90 rounded-full bg-indigo-400/0 blur-2xl transition-all duration-500 group-hover:scale-110 group-hover:bg-indigo-400/20" />
            {product.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.imageUrl}
                alt={product.name}
                className="relative h-full w-full object-contain transition-transform duration-500 ease-out group-hover:scale-110"
              />
            ) : (
              <span className="relative text-4xl">📦</span>
            )}
          </div>
        </Link>

        <button
          onClick={() => toggleWishlist(product.id)}
          aria-label="Sevimlilarga qo'shish"
          className={`absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-100 transition hover:scale-110 hover:shadow-md ${
            isWishlisted(product.id) ? "text-rose-500" : "text-slate-400"
          }`}
        >
          <svg
            viewBox="0 0 24 24"
            fill={isWishlisted(product.id) ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth={2}
            className="h-4.5 w-4.5"
          >
            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
          </svg>
        </button>

        <div className="absolute inset-x-3 bottom-3 z-10 flex justify-center gap-2 opacity-0 transition duration-300 group-hover:opacity-100">
          <button
            onClick={() => openQuickView(product.slug)}
            className="rounded-full bg-slate-900/85 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-900"
          >
            Tezkor ko&apos;rish
          </button>
          <button
            onClick={handleCompareToggle}
            disabled={!comparing && maxReached}
            aria-label="Solishtirish"
            title="Solishtirish"
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-40 ${
              comparing
                ? "bg-indigo-600 text-white"
                : "bg-slate-900/85 text-white hover:bg-slate-900"
            }`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
              <path d="M8 3v18M16 3v18M4 8h8M12 16h8" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-black text-slate-900">
            {formatSum(product.price)}
          </span>
          {product.oldPrice && (
            <span className="text-xs text-slate-400 line-through">
              {formatSum(product.oldPrice)}
            </span>
          )}
        </div>

        <Link href={`/product/${product.slug}`}>
          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm text-slate-600 hover:text-indigo-600">
            {product.name}
          </h3>
        </Link>

        <StarRating rating={product.rating} reviewCount={product.reviewCount} />

        <div className="mt-0.5 flex items-center gap-1.5 text-sm font-medium text-emerald-600">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M3 7h11v10H3zM14 10h4l3 3v4h-7z" strokeLinejoin="round" />
            <circle cx="7.5" cy="17.5" r="1.5" />
            <circle cx="17.5" cy="17.5" r="1.5" />
          </svg>
          Bepul yetkazib berish
        </div>

        {product.soldCount > 0 && (
          <span className="text-xs text-slate-400">
            {product.soldCount}+ sotilgan
          </span>
        )}

        <button
          onClick={handleAdd}
          disabled={outOfStock}
          className="mt-2 w-full rounded-full bg-indigo-600 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
        >
          {outOfStock ? "Tugagan" : added ? "Qo'shildi ✓" : "Korzinaga qo'shish"}
        </button>
      </div>
    </div>
  );
}
