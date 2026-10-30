"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRfq } from "@/lib/rfq-context";
import { formatSum } from "@/lib/format";
import { useI18n } from "@/i18n/client";
import { submitRfq } from "../actions";
import { ProductImage } from "@/components/product-image";

const input = "w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-indigo-400";

export default function KorzinaPage() {
  const { t, href, locale } = useI18n();
  const { items, removeItem, setQuantity, totalPrice, clear } = useRfq();
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("+998 ");
  const [requestType, setRequestType] = useState(t.cart.types[0]);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Names are stored in the language the item was added in; show them in the page language.
  const [localNames, setLocalNames] = useState<Record<string, string>>({});
  const ids = items.map((i) => i.productId).join(",");
  useEffect(() => {
    if (!ids) return;
    let cancelled = false;
    fetch("/api/products-by-ids", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: ids.split(","), locale }),
    })
      .then((r) => r.json())
      .then((d: { products?: { id: string; name: string }[] }) => {
        if (!cancelled) setLocalNames(Object.fromEntries((d.products ?? []).map((p) => [p.id, p.name])));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [ids, locale]);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <p className="text-4xl" aria-hidden="true">📋</p>
        <h1 className="mt-4 text-2xl font-bold text-slate-800">{t.cart.emptyTitle}</h1>
        <p className="mt-2 text-slate-500">{t.cart.emptyText}</p>
        <Link href={href("/search")} className="mt-6 inline-block rounded-full bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700">
          {t.common.backToCatalog}
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await submitRfq(
      { companyName, contactName, phone, requestType, comment, items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })) },
      locale
    );
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    clear();
    router.push(`${href("/korzina-yuborildi")}?id=${result.requestId}`);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-800">{t.cart.title}</h1>
      <p className="mt-1 text-sm text-slate-500">{t.cart.subtitle}</p>

      <ul className="mt-6 divide-y divide-slate-100 rounded-2xl border border-slate-200">
        {items.map((item) => (
          <li key={item.productId} className="flex flex-wrap items-center gap-4 p-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-50 p-1.5">
              {item.imageUrl ? (
                <ProductImage src={item.imageUrl} alt={localNames[item.productId] ?? item.name} sizes="64px" />
              ) : (
                <span className="text-2xl">📦</span>
              )}
            </div>
            <div className="min-w-[10rem] flex-1">
              <Link href={href(`/product/${item.slug}`)} className="font-medium text-slate-800 hover:text-indigo-700">
                {localNames[item.productId] ?? item.name}
              </Link>
              <p className="text-sm text-slate-500">{item.price > 0 ? formatSum(item.price, locale) : t.product.priceOnRequest}</p>
            </div>
            <div className="flex items-center rounded-full border border-slate-200">
              <button type="button" aria-label="−" onClick={() => setQuantity(item.productId, item.quantity - 1)} className="h-8 w-8 rounded-full text-slate-600 hover:bg-slate-100">
                −
              </button>
              <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
              <button type="button" aria-label="+" onClick={() => setQuantity(item.productId, item.quantity + 1)} className="h-8 w-8 rounded-full text-slate-600 hover:bg-slate-100">
                +
              </button>
            </div>
            <span className="w-32 text-right font-semibold text-slate-800">{item.price > 0 ? formatSum(item.price * item.quantity, locale) : "—"}</span>
            <button type="button" onClick={() => removeItem(item.productId)} aria-label={t.common.remove} className="text-slate-400 hover:text-red-500">
              ✕
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex justify-end text-lg">
        <span className="text-slate-500">{t.cart.estimated}:</span>
        <span className="ml-2 font-bold text-slate-900">{formatSum(totalPrice, locale)}</span>
      </div>
      {items.some((i) => i.price <= 0) && <p className="mt-1 text-right text-sm text-slate-500">{t.product.notInTotal}</p>}

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <div>
          <label htmlFor="c-company" className="mb-1 block text-sm font-medium text-slate-600">{t.cart.company} *</label>
          <input id="c-company" required maxLength={200} value={companyName} onChange={(e) => setCompanyName(e.target.value)} className={input} placeholder={t.quickRfq.companyPlaceholder} />
        </div>
        <div>
          <label htmlFor="c-contact" className="mb-1 block text-sm font-medium text-slate-600">{t.cart.contact} *</label>
          <input id="c-contact" required maxLength={200} value={contactName} onChange={(e) => setContactName(e.target.value)} className={input} placeholder={t.cart.contactPlaceholder} autoComplete="name" />
        </div>
        <div>
          <label htmlFor="c-phone" className="mb-1 block text-sm font-medium text-slate-600">{t.cart.phone} *</label>
          <input id="c-phone" required type="tel" maxLength={30} value={phone} onChange={(e) => setPhone(e.target.value)} className={input} autoComplete="tel" />
        </div>
        <div>
          <label htmlFor="c-type" className="mb-1 block text-sm font-medium text-slate-600">{t.cart.type} *</label>
          <select id="c-type" required value={requestType} onChange={(e) => setRequestType(e.target.value)} className={input}>
            {t.cart.types.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="c-comment" className="mb-1 block text-sm font-medium text-slate-600">{t.cart.comment}</label>
          <textarea id="c-comment" maxLength={3000} value={comment} onChange={(e) => setComment(e.target.value)} rows={3} className={input} placeholder={t.cart.commentPlaceholder} />
        </div>
        {error && <p role="alert" className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={submitting} className="mt-2 rounded-full bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300">
          {submitting ? t.common.sending : t.cart.submit}
        </button>
        <p className="text-center text-xs text-slate-400">{t.cart.privacy}</p>
      </form>
    </div>
  );
}
