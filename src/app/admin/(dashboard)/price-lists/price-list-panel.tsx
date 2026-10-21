"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  upsertPriceListItemAction,
  removePriceListItemAction,
  deletePriceListAction,
} from "./actions";

type ListItem = {
  productId: string;
  productName: string;
  productSku: string | null;
  price: number;
  basePrice: number;
};

type ProductOption = {
  id: string;
  name: string;
  price: number;
  sku: string | null;
  costPrice: number | null;
};

export type PriceListViewModel = {
  id: string;
  name: string;
  kind: string;
  isDefault: boolean;
  customerCount: number;
  items: ListItem[];
};

function formatPrice(value: number): string {
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export function PriceListPanel({
  list,
  products,
}: {
  list: PriceListViewModel;
  products: ProductOption[];
}) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [productId, setProductId] = useState("");
  const [price, setPrice] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const itemByProduct = new Map(list.items.map((i) => [i.productId, i]));

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!productId) {
      setError("Mahsulotni tanlang.");
      return;
    }
    const value = Number(price);
    if (!Number.isFinite(value) || value < 0) {
      setError("Narx noto'g'ri.");
      return;
    }
    startTransition(async () => {
      const result = await upsertPriceListItemAction(list.id, productId, value);
      if (!result.ok) setError(result.error);
      else {
        setAddOpen(false);
        setProductId("");
        setPrice("");
        router.refresh();
      }
    });
  }

  function handleRemove(pid: string) {
    startTransition(async () => {
      const result = await removePriceListItemAction(list.id, pid);
      if (!result.ok) setError(result.error);
      else router.refresh();
    });
  }

  function handleDeleteList() {
    if (
      !window.confirm(
        `"${list.name}" ro'yxatini o'chirishni tasdiqlaysizmi? Ichidagi narxlar ham o'chadi.`
      )
    ) {
      return;
    }
    startTransition(async () => {
      const result = await deletePriceListAction(list.id);
      if (!result.ok) setError(result.error);
      else router.refresh();
    });
  }

  const availableProducts = products.filter((p) => !itemByProduct.has(p.id));

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-slate-900">{list.name}</h2>
          {list.isDefault && (
            <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
              Asosiy
            </span>
          )}
          <span className="text-xs text-slate-400">
            {list.items.length} ta mahsulot · {list.customerCount} ta mijoz
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAddOpen((v) => !v)}
            disabled={availableProducts.length === 0}
            className="rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {addOpen ? "Yopish" : "+ Narx qo'shish"}
          </button>
          {!list.isDefault && (
            <button
              type="button"
              onClick={handleDeleteList}
              disabled={pending}
              className="rounded-lg border border-rose-200 px-3.5 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
            >
              O&apos;chirish
            </button>
          )}
        </div>
      </div>

      {addOpen && (
        <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4">
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            Mahsulot
            <select
              value={productId}
              onChange={(e) => {
                setProductId(e.target.value);
                const p = products.find((x) => x.id === e.target.value);
                if (p) setPrice(String(p.price));
              }}
              className="w-64 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400"
            >
              <option value="">Tanlang…</option>
              {availableProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.sku ? ` (${p.sku})` : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            Narx (so&apos;m)
            <input
              type="number"
              min={0}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-40 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400"
            />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {pending ? "..." : "Saqlash"}
          </button>
          {error && <p className="text-sm text-rose-600">{error}</p>}
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3">Mahsulot</th>
              <th className="px-5 py-3 text-right">Chakana narx</th>
              <th className="px-5 py-3 text-right">Ro&apos;yxatdagi narx</th>
              <th className="px-5 py-3 text-right">Farq</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {list.items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                  Bu ro&apos;yxatda narxlar yo&apos;q — qo&apos;shing.
                </td>
              </tr>
            )}
            {list.items.map((item) => {
              const diff = item.price - item.basePrice;
              return (
                <tr key={item.productId} className="hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <span className="font-medium text-slate-800">{item.productName}</span>
                    {item.productSku && (
                      <span className="ml-2 text-xs text-slate-400">{item.productSku}</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right text-slate-500">
                    {formatPrice(item.basePrice)}
                  </td>
                  <td className="px-5 py-3 text-right font-semibold text-slate-900">
                    {formatPrice(item.price)}
                  </td>
                  <td
                    className={`px-5 py-3 text-right text-xs font-medium ${
                      diff === 0
                        ? "text-slate-400"
                        : diff > 0
                          ? "text-emerald-600"
                          : "text-rose-600"
                    }`}
                  >
                    {diff === 0 ? "—" : `${diff > 0 ? "+" : ""}${formatPrice(diff)}`}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleRemove(item.productId)}
                      disabled={pending}
                      className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                    >
                      O&apos;chirish
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {error && addOpen === false && (
        <p className="px-5 py-3 text-sm text-rose-600">{error}</p>
      )}
    </div>
  );
}
