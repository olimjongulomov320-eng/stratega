"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRfq } from "@/lib/rfq-context";
import { formatSum } from "@/lib/format";
import { submitRfq } from "./actions";

const REQUEST_TYPES = [
  "Ob'ekt komplektatsiyasi",
  "Aniq mahsulot",
  "Doimiy yetkazib berish",
];

export default function KorzinaPage() {
  const { items, removeItem, setQuantity, totalPrice, clear } = useRfq();
  const router = useRouter();

  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [requestType, setRequestType] = useState(REQUEST_TYPES[0]);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <p className="text-4xl">📋</p>
        <h1 className="mt-4 text-2xl font-bold text-slate-800">
          Korzinangiz bo&apos;sh
        </h1>
        <p className="mt-2 text-slate-500">
          Katalogdan mahsulot tanlab, korzinaga qo&apos;shing.
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

    const result = await submitRfq({
      companyName,
      contactName,
      phone,
      requestType,
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
    router.push(`/korzina-yuborildi?id=${result.requestId}`);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-800">
        Korzina — kommertsiya taklifi uchun ariza
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Menejerimiz 30 daqiqa ichida siz bilan bog&apos;lanadi va aniq
        narxlarni taqdim etadi.
      </p>

      <ul className="mt-6 divide-y divide-slate-100 rounded-2xl border border-slate-200">
        {items.map((item) => (
          <li key={item.productId} className="flex items-center gap-4 p-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-50">
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="h-full w-full object-cover"
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
                type="button"
                onClick={() => setQuantity(item.productId, item.quantity - 1)}
                className="h-8 w-8 rounded-full text-slate-600 hover:bg-slate-100"
              >
                −
              </button>
              <span className="w-8 text-center text-sm font-medium">
                {item.quantity}
              </span>
              <button
                type="button"
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
              type="button"
              onClick={() => removeItem(item.productId)}
              aria-label="O'chirish"
              className="text-slate-400 hover:text-red-500"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex justify-end text-lg">
        <span className="text-slate-500">Taxminiy summa: </span>
        <span className="ml-2 font-bold text-slate-900">
          {formatSum(totalPrice)}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">
            Kompaniya nomi *
          </label>
          <input
            required
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-indigo-400"
            placeholder="OOO «Kompaniya nomi»"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">
            Kontakt shaxs *
          </label>
          <input
            required
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
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
            So&apos;rov turi *
          </label>
          <select
            required
            value={requestType}
            onChange={(e) => setRequestType(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-indigo-400"
          >
            {REQUEST_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
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
            placeholder="Qo'shimcha ma'lumot, spetsifikatsiya va h.k."
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
          {submitting ? "Yuborilmoqda..." : "Kommertsiya taklifini olish →"}
        </button>

        <p className="text-center text-xs text-slate-400">
          Ma&apos;lumotlaringiz faqat aloqa uchun ishlatiladi. Menejerimiz
          NDS va hujjatlar bo&apos;yicha ham maslahat beradi.
        </p>
      </form>
    </div>
  );
}
