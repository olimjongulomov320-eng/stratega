"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRfq } from "@/lib/rfq-context";
import type { ProductCardData } from "@/components/product-card";

export function RfqForm({ product }: { product: ProductCardData }) {
  const { addItem } = useRfq();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const outOfStock = product.stock <= 0;

  function handleAdd() {
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
  }

  function handleRequestNow() {
    handleAdd();
    router.push("/korzina");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-slate-600">Miqdor:</span>
        <div className="flex items-center rounded-full border border-slate-200">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="h-9 w-9 rounded-full text-lg text-slate-600 hover:bg-slate-100"
          >
            −
          </button>
          <span className="w-8 text-center font-medium">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((q) => q + 1)}
            className="h-9 w-9 rounded-full text-lg text-slate-600 hover:bg-slate-100"
          >
            +
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={handleAdd}
          disabled={outOfStock}
          className="flex-1 rounded-full border-2 border-indigo-600 py-3 font-semibold text-indigo-600 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
        >
          Korzinaga qo&apos;shish
        </button>
        <button
          onClick={handleRequestNow}
          disabled={outOfStock}
          className="flex-1 rounded-full bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
        >
          {outOfStock ? "Tugagan" : "Narxini so'rash"}
        </button>
      </div>
    </div>
  );
}
