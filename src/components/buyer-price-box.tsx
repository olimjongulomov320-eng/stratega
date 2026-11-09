"use client";

import { useBuyerPrice } from "@/lib/buyer-prices-context";
import { formatSum } from "@/lib/format";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n";
import type { ProductCardData } from "@/lib/products";

/** Product page: the logged-in buyer's own price, under the public one. */
export function BuyerPriceBox({ product }: { product: ProductCardData }) {
  const { t, locale } = useI18n();
  const { buyerPrice, companyName } = useBuyerPrice(product);
  if (!buyerPrice) return null;
  return (
    <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
      <p className="text-sm text-emerald-700">{t.focus.yourPrice}</p>
      <p className="text-2xl font-bold text-emerald-700">{formatSum(buyerPrice, locale)}</p>
      <p className="text-xs text-emerald-600">{fmt(t.focus.yourPriceNote, { company: companyName ?? "" })}</p>
    </div>
  );
}
