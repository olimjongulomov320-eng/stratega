"use client";

import { useEffect, useState } from "react";
import { useRecentlyViewed } from "@/lib/recently-viewed-context";
import { ProductCard, type ProductCardData } from "@/components/product-card";

export function RecentlyViewedSection({ excludeId }: { excludeId?: string }) {
  const { productIds } = useRecentlyViewed();
  const [products, setProducts] = useState<ProductCardData[]>([]);

  const relevantIds = productIds.filter((id) => id !== excludeId).slice(0, 6);

  useEffect(() => {
    if (relevantIds.length === 0) {
      // Nothing viewed yet (or all excluded) — clear stale results.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProducts([]);
      return;
    }
    let cancelled = false;
    fetch("/api/products-by-ids", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: relevantIds }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const byId = new Map(
          (data.products ?? []).map((p: ProductCardData) => [p.id, p])
        );
        const ordered = relevantIds
          .map((id) => byId.get(id))
          .filter((p): p is ProductCardData => Boolean(p));
        setProducts(ordered);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [relevantIds.join(",")]);

  if (products.length === 0) return null;

  return (
    <section className="mt-14 border-t border-slate-200 pt-8">
      <h2 className="mb-5 text-xl font-bold text-slate-800">
        Yaqinda ko&apos;rilgan
      </h2>
      <div className="product-grid grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
