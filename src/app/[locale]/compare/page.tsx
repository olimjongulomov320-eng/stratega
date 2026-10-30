"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCompare } from "@/lib/compare-context";
import { useRfq } from "@/lib/rfq-context";
import { formatSum } from "@/lib/format";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n";
import { ProductImage } from "@/components/product-image";

type CompareProduct = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string | null;
  stock: number;
  sku: string | null;
  categoryName: string;
};

export default function ComparePage() {
  const { t, href, locale } = useI18n();
  const { items, remove, clear } = useCompare();
  const { addItem } = useRfq();
  const [products, setProducts] = useState<CompareProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (items.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProducts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch("/api/products-by-ids", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: items.map((i) => i.id), locale, full: true }),
    })
      .then((res) => res.json())
      .then((data) => setProducts(data.products ?? []))
      .finally(() => setLoading(false));
  }, [items, locale]);

  if (!loading && products.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <p className="text-4xl" aria-hidden="true">⚖️</p>
        <h1 className="mt-4 text-2xl font-bold text-slate-800">{t.compare.empty}</h1>
        <Link href={href("/search")} className="mt-6 inline-block rounded-full bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700">
          {t.common.backToCatalog}
        </Link>
      </div>
    );
  }

  const rows: { label: string; render: (p: CompareProduct) => React.ReactNode }[] = [
    { label: t.compare.price, render: (p) => <span className="font-bold text-indigo-600">{formatSum(p.price, locale)}</span> },
    { label: t.compare.model, render: (p) => p.sku ?? "—" },
    { label: t.compare.category, render: (p) => p.categoryName },
    { label: t.compare.stock, render: (p) => (p.stock > 0 ? fmt(t.product.inStock, { n: p.stock }) : t.product.notInStock) },
    { label: t.product.description, render: (p) => <span className="line-clamp-6 whitespace-pre-line text-sm text-slate-600">{p.description}</span> },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">{t.compare.title}</h1>
        <button onClick={clear} className="text-sm text-slate-500 hover:text-slate-700">
          {t.common.clear}
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr>
              <th className="w-40" />
              {products.map((p) => (
                <th key={p.id} className="p-3 align-top">
                  <div className="flex flex-col items-center gap-2">
                    <button onClick={() => remove(p.id)} className="self-end text-xs text-slate-400 hover:text-red-500" aria-label={t.common.remove}>
                      ✕
                    </button>
                    <div className="flex h-28 w-28 items-center justify-center rounded-xl bg-slate-50 p-2">
                      {p.imageUrl ? (
                        <ProductImage src={p.imageUrl} alt={p.name} sizes="112px" />
                      ) : (
                        <span className="text-3xl">📦</span>
                      )}
                    </div>
                    <Link href={href(`/product/${p.slug}`)} className="text-center font-semibold text-slate-800 hover:text-indigo-600">
                      {p.name}
                    </Link>
                    <button
                      onClick={() => addItem({ productId: p.id, slug: p.slug, name: p.name, price: p.price, imageUrl: p.imageUrl })}
                      className="rounded-full bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
                    >
                      {t.product.addToCart}
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-t border-slate-100">
                <th scope="row" className="p-3 text-left font-medium text-slate-500">
                  {row.label}
                </th>
                {products.map((p) => (
                  <td key={p.id} className="p-3 text-center align-top text-slate-700">
                    {row.render(p)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
