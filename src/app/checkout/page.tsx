"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { formatSum } from "@/lib/format";
import { placeOrder } from "./actions";

export default function CheckoutPage() {
  const { items, totalPrice, clear } = useCart();
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <h1 className="text-2xl font-bold text-slate-800">Savat bo&apos;sh</h1>
        <p className="mt-2 text-slate-500">
          Buyurtma berish uchun avval mahsulot tanlang.
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const result = await placeOrder({
      customerName: name,
      customerPhone: phone,
      address,
      comment,
      items: items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
      })),
    });

    setSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    clear();
    router.push(`/order-confirmed?id=${result.orderId}`);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-800">Buyurtmani rasmiylashtirish</h1>

      <div className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4">
        <ul className="space-y-1 text-sm text-slate-600">
          {items.map((item) => (
            <li key={item.productId} className="flex justify-between">
              <span>
                {item.name} × {item.quantity}
              </span>
              <span>{formatSum(item.price * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between border-t border-indigo-100 pt-3 font-bold text-slate-900">
          <span>Jami</span>
          <span>{formatSum(totalPrice)}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">
            Ism-familiya *
          </label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-indigo-400"
            placeholder="Ism Familiya"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">
            Telefon raqam *
          </label>
          <input
            required
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-indigo-400"
            placeholder="+998 90 123 45 67"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">
            Yetkazib berish manzili *
          </label>
          <input
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-indigo-400"
            placeholder="Shahar, tuman, ko'cha, uy"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">
            Izoh (ixtiyoriy)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-indigo-400"
            placeholder="Qo'shimcha ma'lumot"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-full bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {submitting ? "Yuborilmoqda..." : "Buyurtmani tasdiqlash"}
        </button>

        <p className="text-center text-xs text-slate-400">
          To&apos;lov naqd yoki karta orqali yetkazib berishda amalga oshiriladi.
          Operatorimiz siz bilan tez orada bog&apos;lanadi.
        </p>
      </form>
    </div>
  );
}
