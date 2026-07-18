"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCompare } from "@/lib/compare-context";
import { useRfq } from "@/lib/rfq-context";
import { formatSum } from "@/lib/format";
import { StarRating } from "@/components/star-rating";

type CompareProduct = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  oldPrice: number | null;
  imageUrl: string | null;
  stock: number;
  rating: number;
  reviewCount: number;
  soldCount: number;
  category: { name: string };
};

export default function ComparePage() {
  const { items, remove, clear } = useCompare();
  const { addItem } = useRfq();
  const [products, setProducts] = useState<CompareProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (items.length === 0) {
      // Compare list is empty — clear stale results instead of fetching.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProducts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch("/api/products-by-ids", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: items.map((i) => i.id) }),
    })
      .then((res) => res.json())
      .then((data) => setProducts(data.products ?? []))
      .finally(() => setLoading(false));
  }, [items]);

  if (!loading && products.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <p className="text-4xl">⚖️</p>
        <h1 className="mt-4 text-2xl font-bold text-slate-800">
          Solishtirish ro&apos;yxati bo&apos;sh
        </h1>
        <p className="mt-2 text-slate-500">
          Mahsulot kartochkasidagi &quot;Solishtirish&quot; belgisini bosib,
          bir nechta mahsulotni qiyoslang.
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

  const rows: { label: string; render: (p: CompareProduct) => React.ReactNode }[] = [
    { label: "Narx", render: (p) => <span className="font-bold text-indigo-600">{formatSum(p.price)}</span> },
    { label: "Kategoriya", render: (p) => p.category.name },
    { label: "Reyting", render: (p) => <StarRating rating={p.rating} reviewCount={p.reviewCount} /> },
    { label: "Sotilgan", render: (p) => `${p.soldCount}+ dona` },
    { label: "Omborda", render: (p) => (p.stock > 0 ? `${p.stock} dona` : "Tugagan") },
    { label: "Tavsif", render: (p) => <span className="text-sm text-slate-600">{p.description}</span> },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">
          Mahsulotlarni solishtirish
        </h1>
        {products.length > 0 && (
          <button
            onClick={clear}
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            Barchasini tozalash
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-separate border-spacing-0">
            <thead>
              <tr>
                <th className="w-32" />
                {products.map((p) => (
                  <th key={p.id} className="p-3 text-left align-top">
                    <div className="relative flex aspect-square w-full max-w-[160px] items-center justify-center rounded-xl bg-slate-50">
                      <button
                        onClick={() => remove(p.id)}
                        aria-label="Olib tashlash"
                        className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white text-slate-400 shadow hover:text-rose-500"
                      >
                        ✕
                      </button>
                      {p.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.imageUrl} alt={p.name} className="h-full w-full rounded-xl object-cover" />
                      ) : (
                        <span className="text-3xl">📦</span>
                      )}
                    </div>
                    <Link
                      href={`/product/${p.slug}`}
                      className="mt-2 block text-sm font-medium text-slate-800 hover:text-indigo-600"
                    >
                      {p.name}
                    </Link>
                    <button
                      onClick={() =>
                        addItem({
                          productId: p.id,
                          slug: p.slug,
                          name: p.name,
                          price: p.price,
                          imageUrl: p.imageUrl,
                        })
                      }
                      disabled={p.stock <= 0}
                      className="mt-2 w-full max-w-[160px] rounded-full bg-indigo-600 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:bg-slate-200"
                    >
                      Korzinaga qo&apos;shish
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="border-t border-slate-100">
                  <td className="p-3 text-sm font-medium text-slate-500">
                    {row.label}
                  </td>
                  {products.map((p) => (
                    <td key={p.id} className="p-3 align-top text-sm text-slate-700">
                      {row.render(p)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
