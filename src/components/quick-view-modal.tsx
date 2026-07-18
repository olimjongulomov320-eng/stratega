"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuickView } from "@/lib/quick-view-context";
import { useCart } from "@/lib/cart-context";
import { useWishlist } from "@/lib/wishlist-context";
import { formatSum } from "@/lib/format";
import { StarRating } from "@/components/star-rating";

type QuickViewProduct = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  oldPrice: number | null;
  imageUrl: string | null;
  stock: number;
  rating: number;
  reviewCount: number;
  soldCount: number;
  category: { name: string; slug: string };
};

export function QuickViewModal() {
  const { openProductSlug, close } = useQuickView();
  const { addItem } = useCart();
  const { isWishlisted, toggle: toggleWishlist } = useWishlist();
  const [product, setProduct] = useState<QuickViewProduct | null>(null);
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!openProductSlug) {
      // Modal just closed — clear stale data so it doesn't flash on reopen.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProduct(null);
      return;
    }
    setLoading(true);
    setQuantity(1);
    setAdded(false);
    fetch(`/api/product/${openProductSlug}`)
      .then((res) => res.json())
      .then((data) => setProduct(data.product ?? null))
      .finally(() => setLoading(false));
  }, [openProductSlug]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    if (openProductSlug) {
      document.addEventListener("keydown", handleKey);
      return () => document.removeEventListener("keydown", handleKey);
    }
  }, [openProductSlug, close]);

  if (!openProductSlug) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4"
      onClick={close}
    >
      <div
        className="animate-modal-in max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-end">
          <button
            onClick={close}
            aria-label="Yopish"
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {loading || !product ? (
          <div className="grid animate-pulse gap-6 sm:grid-cols-2">
            <div className="aspect-square rounded-xl bg-slate-100" />
            <div className="flex flex-col gap-3">
              <div className="h-6 w-3/4 rounded bg-slate-100" />
              <div className="h-4 w-1/2 rounded bg-slate-100" />
              <div className="h-8 w-1/3 rounded bg-slate-100" />
              <div className="h-20 rounded bg-slate-100" />
            </div>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="flex aspect-square items-center justify-center rounded-xl bg-slate-50">
              {product.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="h-full w-full rounded-xl object-cover"
                />
              ) : (
                <span className="text-5xl">📦</span>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <span className="text-xs font-medium text-indigo-600">
                {product.category.name}
              </span>
              <h2 className="text-xl font-bold text-slate-900">{product.name}</h2>
              <StarRating rating={product.rating} reviewCount={product.reviewCount} size="md" />

              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-indigo-600">
                  {formatSum(product.price)}
                </span>
                {product.oldPrice && (
                  <span className="text-sm text-slate-400 line-through">
                    {formatSum(product.oldPrice)}
                  </span>
                )}
              </div>

              <p className="line-clamp-3 text-sm text-slate-600">
                {product.description}
              </p>

              <div className="flex items-center gap-3">
                <div className="flex items-center rounded-full border border-slate-200">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="h-8 w-8 rounded-full text-slate-600 hover:bg-slate-100"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-sm font-medium">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="h-8 w-8 rounded-full text-slate-600 hover:bg-slate-100"
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={() => toggleWishlist(product.id)}
                  aria-label="Sevimlilarga qo'shish"
                  className={`flex h-9 w-9 items-center justify-center rounded-full border transition ${
                    isWishlisted(product.id)
                      ? "border-rose-200 bg-rose-50 text-rose-500"
                      : "border-slate-200 text-slate-400 hover:text-rose-500"
                  }`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill={isWishlisted(product.id) ? "currentColor" : "none"}
                    stroke="currentColor"
                    strokeWidth={2}
                    className="h-4 w-4"
                  >
                    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
                  </svg>
                </button>
              </div>

              <div className="mt-1 flex flex-col gap-2 sm:flex-row">
                <button
                  onClick={() => {
                    addItem(
                      {
                        productId: product.id,
                        slug: product.slug,
                        name: product.name,
                        price: product.price,
                        imageUrl: product.imageUrl,
                      },
                      quantity
                    );
                    setAdded(true);
                  }}
                  disabled={product.stock <= 0}
                  className="flex-1 rounded-full bg-indigo-600 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-200"
                >
                  {product.stock <= 0
                    ? "Tugagan"
                    : added
                      ? "Qo'shildi ✓"
                      : "Savatga qo'shish"}
                </button>
                <Link
                  href={`/product/${product.slug}`}
                  onClick={close}
                  className="flex-1 rounded-full border border-slate-200 py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  To&apos;liq ma&apos;lumot
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
