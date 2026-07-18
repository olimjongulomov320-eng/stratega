"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useWishlist } from "@/lib/wishlist-context";
import { ProductCard, type ProductCardData } from "@/components/product-card";

export default function WishlistPage() {
  const { productIds } = useWishlist();
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (productIds.length === 0) {
      // Wishlist is empty — clear stale results instead of fetching.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProducts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch("/api/products-by-ids", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: productIds }),
    })
      .then((res) => res.json())
      .then((data) => setProducts(data.products ?? []))
      .finally(() => setLoading(false));
  }, [productIds]);

  if (!loading && products.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <p className="text-4xl">🤍</p>
        <h1 className="mt-4 text-2xl font-bold text-slate-800">
          Sevimlilar ro&apos;yxati bo&apos;sh
        </h1>
        <p className="mt-2 text-slate-500">
          Mahsulot kartochkasidagi yurakcha belgisini bosib, keyinroq qaytish
          uchun saqlab qo&apos;ying.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-full bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700"
        >
          Katalogga o&apos;tish
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-bold text-slate-800">
        Sevimli mahsulotlar
      </h1>
      {loading ? (
        <div className="product-grid grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : (
        <div className="product-grid grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
