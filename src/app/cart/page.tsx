"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { formatSum } from "@/lib/format";

export default function CartPage() {
  const { items, removeItem, setQuantity, totalPrice } = useCart();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <p className="text-4xl">🛒</p>
        <h1 className="mt-4 text-2xl font-bold text-slate-800">
          Savatingiz bo&apos;sh
        </h1>
        <p className="mt-2 text-slate-500">
          Katalogdan mahsulot tanlab, savatga qo&apos;shing.
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
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-800">Savat</h1>

      <ul className="mt-6 divide-y divide-slate-100">
        {items.map((item) => (
          <li key={item.productId} className="flex items-center gap-4 py-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="h-12 w-12 object-contain"
                />
              ) : (
                <span className="text-2xl">📦</span>
              )}
            </div>

            <div className="flex-1">
              <Link
                href={`/product/${item.slug}`}
                className="font-medium text-slate-800 hover:text-indigo-700"
              >
                {item.name}
              </Link>
              <p className="text-sm text-slate-500">{formatSum(item.price)}</p>
            </div>

            <div className="flex items-center rounded-full border border-slate-200">
              <button
                onClick={() => setQuantity(item.productId, item.quantity - 1)}
                className="h-8 w-8 rounded-full text-slate-600 hover:bg-slate-100"
              >
                −
              </button>
              <span className="w-8 text-center text-sm font-medium">
                {item.quantity}
              </span>
              <button
                onClick={() => setQuantity(item.productId, item.quantity + 1)}
                className="h-8 w-8 rounded-full text-slate-600 hover:bg-slate-100"
              >
                +
              </button>
            </div>

            <span className="w-28 text-right font-semibold text-slate-800">
              {formatSum(item.price * item.quantity)}
            </span>

            <button
              onClick={() => removeItem(item.productId)}
              aria-label="O'chirish"
              className="text-slate-400 hover:text-red-500"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-8 flex flex-col items-end gap-4 border-t border-slate-100 pt-6">
        <div className="text-lg">
          <span className="text-slate-500">Jami: </span>
          <span className="font-bold text-slate-900">
            {formatSum(totalPrice)}
          </span>
        </div>
        <Link
          href="/checkout"
          className="rounded-full bg-indigo-600 px-8 py-3 font-semibold text-white transition hover:bg-indigo-700"
        >
          Buyurtma berish
        </Link>
      </div>
    </div>
  );
}
