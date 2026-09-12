"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useRfq } from "@/lib/rfq-context";
import { formatSum } from "@/lib/format";
import { submitRfq } from "./actions";

export default function KorzinaPage() {
  const { items, removeItem, setQuantity, totalPrice, clear } = useRfq();
  const router = useRouter();
  const t = useTranslations("cart");
  const tCommon = useTranslations("common");
  const tRequestTypes = useTranslations("requestTypes");
  const locale = useLocale();

  const REQUEST_TYPES = [
    tRequestTypes("objectComplectation"),
    tRequestTypes("exactProduct"),
    tRequestTypes("regularDelivery"),
  ];

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
          {t("emptyHeading")}
        </h1>
        <p className="mt-2 text-slate-500">{t("emptyDescription")}</p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-full bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700"
        >
          {tCommon("goToCatalog")}
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
      const errorMessages: Record<string, string> = {
        requiredFields: t("errorRequiredFields"),
        emptyCart: t("errorEmptyCart"),
        productUnavailable: t("errorProductUnavailable"),
      };
      setError(errorMessages[result.errorCode]);
      return;
    }

    clear();
    router.push(`/korzina-yuborildi?id=${result.requestId}`);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-800">{t("heading")}</h1>
      <p className="mt-1 text-sm text-slate-500">{t("subheading")}</p>

      <ul className="mt-6 divide-y divide-slate-100 rounded-2xl border border-slate-200">
        {items.map((item) => (
          <li key={item.productId} className="flex items-center gap-4 p-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-50 p-1.5">
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="h-full w-full object-contain"
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
              <p className="text-sm text-slate-500">{formatSum(item.price, locale)}</p>
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
              {formatSum(item.price * item.quantity, locale)}
            </span>

            <button
              type="button"
              onClick={() => removeItem(item.productId)}
              aria-label={t("removeAria")}
              className="text-slate-400 hover:text-red-500"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex justify-end text-lg">
        <span className="text-slate-500">{t("estimatedTotalLabel")} </span>
        <span className="ml-2 font-bold text-slate-900">
          {formatSum(totalPrice, locale)}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">
            {t("companyNameLabel")}
          </label>
          <input
            required
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-indigo-400"
            placeholder={t("companyNamePlaceholder")}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">
            {t("contactNameLabel")}
          </label>
          <input
            required
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-indigo-400"
            placeholder={t("contactNamePlaceholder")}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">
            {t("phoneLabel")}
          </label>
          <input
            required
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-indigo-400"
            placeholder={t("phonePlaceholder")}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">
            {t("requestTypeLabel")}
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
            {t("commentLabel")}
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-indigo-400"
            placeholder={t("commentPlaceholder")}
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
          {submitting ? tCommon("sending") : tCommon("getQuote")}
        </button>

        <p className="text-center text-xs text-slate-400">
          {t("disclaimer")}
        </p>
      </form>
    </div>
  );
}
