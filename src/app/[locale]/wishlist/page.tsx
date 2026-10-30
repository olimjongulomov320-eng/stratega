"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useWishlist } from "@/lib/wishlist-context";
import { ProductCard, type ProductCardData } from "@/components/product-card";
import { useI18n } from "@/i18n/client";

export default function WishlistPage() {
  const { t, href, locale } = useI18n();
  const { productIds } = useWishlist();
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (productIds.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProducts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch("/api/products-by-ids", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: productIds, locale }),
    })
      .then((res) => res.json())
      .then((data) => setProducts(data.products ?? []))
      .finally(() => setLoading(false));
  }, [productIds, locale]);

  if (!loading && products.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <p className="text-4xl" aria-hidden="true">🤍</p>
        <h1 className="mt-4 text-2xl font-bold text-slate-800">{t.wishlistPage.empty}</h1>
        <Link href={href("/search")} className="mt-6 inline-block rounded-full bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700">
          {t.common.backToCatalog}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-bold text-slate-800">{t.wishlistPage.title}</h1>
      <div className="product-grid grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-slate-100" />)
          : products.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </div>
  );
}
