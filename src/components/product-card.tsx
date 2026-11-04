"use client";

import Link from "next/link";
import { useState } from "react";
import { useRfq } from "@/lib/rfq-context";
import { useWishlist } from "@/lib/wishlist-context";
import { useCompare } from "@/lib/compare-context";
import { useQuickView } from "@/lib/quick-view-context";
import { formatSum } from "@/lib/format";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n";
import type { ProductCardData } from "@/lib/products";
import { ProductImage } from "@/components/product-image";

export type { ProductCardData };

export function ProductCard({ product, priority = false }: { product: ProductCardData; priority?: boolean }) {
  const { t, href, locale } = useI18n();
  const { addItem } = useRfq();
  const { isWishlisted, toggle: toggleWishlist } = useWishlist();
  const { isComparing, toggle: toggleCompare, maxReached } = useCompare();
  const { open: openQuickView } = useQuickView();
  const [added, setAdded] = useState(false);

  const url = href(`/product/${product.slug}`);
  const outOfStock = product.stock <= 0;
  const discount = product.oldPrice ? Math.round(100 - (product.price / product.oldPrice) * 100) : null;
  const comparing = isComparing(product.id);
  const wished = isWishlisted(product.id);

  function handleAdd() {
    addItem({ productId: product.id, slug: product.slug, name: product.name, price: product.buyerPrice ?? product.price, imageUrl: product.imageUrl });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-100">
      <div className="relative">
        <Link href={url} className="relative block" tabIndex={-1} aria-hidden="true">
          {(product.isBestseller || (discount !== null && discount > 0)) && (
            <span className="absolute left-3 top-3 z-10 flex flex-col items-start gap-1">
              {product.isBestseller && <span className="rounded-md bg-amber-400 px-2 py-0.5 text-xs font-bold text-slate-900">🔥 {t.trust.bestseller}</span>}
              {discount !== null && discount > 0 && <span className="rounded-md bg-rose-500 px-2 py-0.5 text-xs font-bold text-white">{fmt(t.product.discount, { n: discount })}</span>}
            </span>
          )}
          <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-slate-50 p-4 sm:p-8">
            {product.imageUrl ? (
              <ProductImage
                src={product.imageUrl}
                alt={product.name}
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                eager={priority}
                className="transition-transform duration-500 ease-out group-hover:scale-110"
              />
            ) : (
              // No photo yet: show the brand instead of an empty box.
              <span className="relative flex flex-col items-center gap-1 text-center" role="img" aria-label={product.name}>
                <span className="text-lg font-black tracking-wide text-slate-300 sm:text-2xl">{product.brand ?? "STRATEGA"}</span>
                {product.sku && <span className="text-xs font-medium text-slate-400">{product.sku}</span>}
              </span>
            )}
          </div>
        </Link>

        <button
          onClick={() => toggleWishlist(product.id)}
          aria-label={t.product.addToWishlist}
          aria-pressed={wished}
          className={`absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-100 transition hover:scale-110 ${
            wished ? "text-rose-500" : "text-slate-400"
          }`}
        >
          <svg viewBox="0 0 24 24" fill={wished ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} className="h-4.5 w-4.5">
            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
          </svg>
        </button>

        {/* On phones the quick-view pill would cover the photo of a narrow card; tapping the card opens the product anyway. */}
        <div className="absolute inset-x-3 bottom-3 z-10 flex justify-end gap-2 opacity-100 transition duration-300 sm:justify-center md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 focus-within:opacity-100">
          <button
            onClick={() => openQuickView(product.slug)}
            className="hidden rounded-full bg-slate-900/85 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-900 sm:block"
          >
            {t.product.quickView}
          </button>
          <button
            onClick={() => toggleCompare({ id: product.id, slug: product.slug, name: product.name, price: product.price, imageUrl: product.imageUrl })}
            disabled={!comparing && maxReached}
            aria-label={t.common.compare}
            aria-pressed={comparing}
            title={t.common.compare}
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-40 ${
              comparing ? "bg-indigo-600 text-white" : "bg-slate-900/85 text-white hover:bg-slate-900"
            }`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
              <path d="M8 3v18M16 3v18M4 8h8M12 16h8" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3 sm:p-5">
        <div className="flex flex-wrap items-baseline gap-x-2">
          {product.priceOnRequest ? (
            <span className="text-sm font-bold text-slate-900 sm:text-lg">{t.product.priceOnRequest}</span>
          ) : (
            <span className="text-[15px] font-black tracking-tight text-slate-900 sm:text-xl sm:tracking-normal">{formatSum(product.price, locale)}</span>
          )}
          {product.oldPrice && <span className="text-xs text-slate-400 line-through sm:text-sm">{formatSum(product.oldPrice, locale)}</span>}
        </div>
        {product.buyerPrice ? (
          <p className="-mt-1 text-xs font-semibold text-emerald-600 sm:text-sm">
            {t.focus.yourPrice}: {formatSum(product.buyerPrice, locale)}
          </p>
        ) : null}

        <Link href={url}>
          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm text-slate-700 [overflow-wrap:anywhere] hyphens-auto hover:text-indigo-600 sm:min-h-[3rem] sm:text-base">{product.name}</h3>
        </Link>

        <div className="mt-auto flex flex-col gap-1 text-xs sm:text-sm">
          <span className={outOfStock ? "text-slate-400" : "font-medium text-emerald-600"}>
            {outOfStock ? t.product.notInStock : t.product.inStockShort}
          </span>
          {product.freeDelivery && <span className="font-medium text-emerald-600">🚚 {t.product.freeDelivery}</span>}
        </div>

        <button
          onClick={handleAdd}
          aria-live="polite"
          className="mt-2 w-full rounded-full bg-indigo-600 px-1 py-2.5 text-[13px] font-semibold leading-tight text-white transition hover:bg-indigo-700 sm:mt-3 sm:px-2 sm:py-3 sm:text-base"
        >
          {added ? t.product.added : product.priceOnRequest ? t.product.requestPrice : t.product.addToCart}
        </button>
      </div>
    </div>
  );
}
