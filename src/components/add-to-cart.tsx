"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRfq } from "@/lib/rfq-context";
import { useI18n } from "@/i18n/client";
import type { ProductCardData } from "@/lib/products";

export function AddToCart({ product }: { product: ProductCardData }) {
  const { t, href } = useI18n();
  const { addItem } = useRfq();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  function add() {
    addItem({ productId: product.id, slug: product.slug, name: product.name, price: product.price, imageUrl: product.imageUrl }, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-slate-600" id="qty-label">
          {t.product.quantity}:
        </span>
        <div className="flex items-center rounded-full border border-slate-200" role="group" aria-labelledby="qty-label">
          <button type="button" aria-label="−" onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="h-9 w-9 rounded-full text-lg text-slate-600 hover:bg-slate-100">
            −
          </button>
          <span className="w-10 text-center font-medium" aria-live="polite">
            {quantity}
          </span>
          <button type="button" aria-label="+" onClick={() => setQuantity((q) => Math.min(9999, q + 1))} className="h-9 w-9 rounded-full text-lg text-slate-600 hover:bg-slate-100">
            +
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={add}
          className="flex-1 rounded-full border-2 border-indigo-600 py-3 font-semibold text-indigo-600 transition hover:bg-indigo-50"
        >
          {added ? t.product.added : t.product.addToCart}
        </button>
        <button
          onClick={() => {
            add();
            router.push(href("/korzina"));
          }}
          className="flex-1 rounded-full bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-700"
        >
          {product.priceOnRequest ? t.product.requestPrice : t.product.orderNow}
        </button>
      </div>
    </div>
  );
}
